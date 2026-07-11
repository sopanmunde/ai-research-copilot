"""
src/core/llm_factory.py — Multi-LLM Provider Factory
=====================================================
Returns the appropriate LangChain chat model based on provider string.
Supports: anthropic, google, groq, mistral
"""
from functools import lru_cache
from typing import Optional

from langchain_core.language_models.chat_models import BaseChatModel
from src.core.config import settings
from src.core.logger import get_logger

logger = get_logger(__name__)

PROVIDER_PRIORITY = ["anthropic", "google", "groq", "mistral"]

from contextvars import ContextVar

PROVIDER_MODEL_MAP = {
    "anthropic":  ("ANTHROPIC_API_KEY",  settings.ANTHROPIC_CHAT_MODEL),
    "google":     ("GOOGLE_API_KEY",     settings.GEMINI_MODEL),
    "groq":       ("GROQ_API_KEY",      settings.GROQ_CHAT_MODEL),
    "mistral":    ("MISTRAL_API_KEY",   settings.MISTRAL_CHAT_MODEL),
}

current_user_keys: ContextVar[dict] = ContextVar("current_user_keys", default={})


import asyncio
import time

class LLMRateLimiter:
    def __init__(self):
        self.last_request_time = 0.0
        self.lock = asyncio.Lock()

    async def throttle_async(self):
        rate_limit = getattr(settings, "RATE_LIMIT_PER_MINUTE", 60)
        if rate_limit <= 0:
            return
        
        interval = 60.0 / rate_limit
        async with self.lock:
            now = time.monotonic()
            time_since_last = now - self.last_request_time
            if time_since_last < interval:
                sleep_time = interval - time_since_last
                logger.info(
                    f"RateLimiter: Throttling async LLM request. "
                    f"Sleeping for {sleep_time:.2f}s (Rate: {rate_limit} RPM)"
                )
                await asyncio.sleep(sleep_time)
            self.last_request_time = time.monotonic()


_global_limiter = LLMRateLimiter()


from langchain_core.callbacks import AsyncCallbackHandler

class RateLimitingCallbackHandler(AsyncCallbackHandler):
    async def on_llm_start(self, *args, **kwargs) -> None:
        await _global_limiter.throttle_async()

    async def on_chat_model_start(self, *args, **kwargs) -> None:
        await _global_limiter.throttle_async()


def _wrap_with_rate_limit(llm: BaseChatModel) -> None:
    llm.callbacks = (llm.callbacks or []) + [RateLimitingCallbackHandler()]


def get_llm(
    provider: str = "",
    model_name: str = "",
    temperature: float = 0.2,
    streaming: bool = True,
    api_key: Optional[str] = None,
) -> BaseChatModel:
    """
    Factory: returns a LangChain chat model for the given provider.

    Args:
        provider:  'anthropic' | 'google' | 'groq' | 'mistral'
        model_name: Override the default model for the provider.
        temperature: LLM temperature (0.0 - 1.0).
        streaming: Enable token-level streaming.
        api_key: Optional custom API key.

    Returns:
        A BaseChatModel instance.

    Raises:
        ValueError: If the provider is unknown.
        RuntimeError: If the required API key is missing.
    """
    provider = (provider or settings.DEFAULT_LLM_PROVIDER).lower().strip()
    model = model_name or ""
    provider = _resolve_provider(provider, model)

    # Read custom user keys from ContextVar if none is passed explicitly
    if not api_key:
        keys_dict = current_user_keys.get()
        if keys_dict and provider in keys_dict:
            api_key = keys_dict[provider]

    logger.info(f"LLM Factory: provider={provider}, model={model or 'default'}, temp={temperature}")

    if provider == "anthropic":
        llm = _build_anthropic(model, temperature, streaming, api_key)
    elif provider == "google":
        llm = _build_google(model, temperature, streaming, api_key)
    elif provider == "groq":
        llm = _build_groq(model, temperature, streaming, api_key)
    elif provider == "mistral":
        llm = _build_mistral(model, temperature, streaming, api_key)
    else:
        raise ValueError(f"Unknown LLM provider: '{provider}'. "
                         f"Supported: {', '.join(PROVIDER_MODEL_MAP)}")

    _wrap_with_rate_limit(llm)
    return llm


def _resolve_provider(provider: str, model: str) -> str:
    """Auto-detect provider from model name if provider is not explicitly set."""
    if provider and provider != "default":
        return provider
    if not model:
        return settings.DEFAULT_LLM_PROVIDER
    model_lower = model.lower()
    if model_lower.startswith("claude"):
        return "anthropic"
    if model_lower.startswith("gemini"):
        return "google"
    if model_lower.startswith("llama") or "mixtral" in model_lower:
        return "groq"
    if model_lower.startswith("mistral"):
        return "mistral"
    return settings.DEFAULT_LLM_PROVIDER


def _require_api_key(env_var: str, provider_name: str, api_key: Optional[str] = None) -> str:
    if api_key:
        return api_key
    key = getattr(settings, env_var, "") or ""
    if not key:
        raise RuntimeError(
            f"{env_var} is not set. "
            f"Add it to your .env file to use {provider_name}."
        )
    return key


def _build_anthropic(model: str, temperature: float, streaming: bool, api_key: Optional[str] = None) -> BaseChatModel:
    from langchain_anthropic import ChatAnthropic
    key = _require_api_key("ANTHROPIC_API_KEY", "Anthropic", api_key)
    return ChatAnthropic(
        model=model or settings.ANTHROPIC_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=key,
    )


def _build_google(model: str, temperature: float, streaming: bool, api_key: Optional[str] = None) -> BaseChatModel:
    from langchain_google_genai import ChatGoogleGenerativeAI
    key = _require_api_key("GOOGLE_API_KEY", "Google Gemini", api_key)
    return ChatGoogleGenerativeAI(
        model=model or settings.GEMINI_MODEL,
        temperature=temperature,
        streaming=streaming,
        google_api_key=key,
        max_output_tokens=4096,
        max_retries=0,
    )


def _build_groq(model: str, temperature: float, streaming: bool, api_key: Optional[str] = None) -> BaseChatModel:
    from langchain_groq import ChatGroq
    key = _require_api_key("GROQ_API_KEY", "Groq", api_key)
    return ChatGroq(
        model=model or settings.GROQ_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=key,
    )


def _build_mistral(model: str, temperature: float, streaming: bool, api_key: Optional[str] = None) -> BaseChatModel:
    from langchain_mistralai import ChatMistralAI
    key = _require_api_key("MISTRAL_API_KEY", "Mistral", api_key)
    return ChatMistralAI(
        model=model or settings.MISTRAL_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=key,
    )



def get_available_providers() -> dict:
    """Return which providers are configured (have API keys set)."""
    return {
        "anthropic": bool(settings.ANTHROPIC_API_KEY),
        "google":    bool(settings.GOOGLE_API_KEY),
        "groq":      bool(settings.GROQ_API_KEY),
        "mistral":   bool(settings.MISTRAL_API_KEY),
    }


def get_fallback_providers(primary_provider: str) -> list[str]:
    """
    Return ordered list of providers to try, starting with the primary.

    On quota failure the caller should iterate through this list and
    emit a *provider_switch* SSE event on each retry.
    """
    configured = get_available_providers()
    result: list[str] = []
    primary = primary_provider.lower().strip() if primary_provider else settings.DEFAULT_LLM_PROVIDER

    if configured.get(primary, False):
        result.append(primary)

    for p in PROVIDER_PRIORITY:
        if p != primary and configured.get(p, False):
            result.append(p)

    return result


def is_quota_error(exc: Exception) -> bool:
    """Detect quota / rate-limit / resource-exhausted errors across providers."""
    msg = str(exc).lower()
    return any(kw in msg for kw in ("429", "quota", "resource_exhausted", "rate_limit", "rate limit"))
