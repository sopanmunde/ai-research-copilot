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

PROVIDER_MODEL_MAP = {
    "anthropic":  ("ANTHROPIC_API_KEY",  settings.ANTHROPIC_CHAT_MODEL),
    "google":     ("GOOGLE_API_KEY",     settings.GEMINI_MODEL),
    "groq":       ("GROQ_API_KEY",      settings.GROQ_CHAT_MODEL),
    "mistral":    ("MISTRAL_API_KEY",   settings.MISTRAL_CHAT_MODEL),
}


def get_llm(
    provider: str = "",
    model_name: str = "",
    temperature: float = 0.2,
    streaming: bool = True,
) -> BaseChatModel:
    """
    Factory: returns a LangChain chat model for the given provider.

    Args:
        provider:  'anthropic' | 'google' | 'groq' | 'mistral'
        model_name: Override the default model for the provider.
        temperature: LLM temperature (0.0 - 1.0).
        streaming: Enable token-level streaming.

    Returns:
        A BaseChatModel instance.

    Raises:
        ValueError: If the provider is unknown.
        RuntimeError: If the required API key is missing.
    """
    provider = (provider or settings.DEFAULT_LLM_PROVIDER).lower().strip()
    model = model_name or ""
    provider = _resolve_provider(provider, model)

    logger.info(f"LLM Factory: provider={provider}, model={model or 'default'}, temp={temperature}")

    if provider == "anthropic":
        return _build_anthropic(model, temperature, streaming)
    elif provider == "google":
        return _build_google(model, temperature, streaming)
    elif provider == "groq":
        return _build_groq(model, temperature, streaming)
    elif provider == "mistral":
        return _build_mistral(model, temperature, streaming)
    else:
        raise ValueError(f"Unknown LLM provider: '{provider}'. "
                         f"Supported: {', '.join(PROVIDER_MODEL_MAP)}")


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


def _require_api_key(env_var: str, provider_name: str) -> str:
    key = getattr(settings, env_var, "") or ""
    if not key:
        raise RuntimeError(
            f"{env_var} is not set. "
            f"Add it to your .env file to use {provider_name}."
        )
    return key


def _build_anthropic(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_anthropic import ChatAnthropic
    api_key = _require_api_key("ANTHROPIC_API_KEY", "Anthropic")
    return ChatAnthropic(
        model=model or settings.ANTHROPIC_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=api_key,
    )


def _build_google(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_google_genai import ChatGoogleGenerativeAI
    api_key = _require_api_key("GOOGLE_API_KEY", "Google Gemini")
    return ChatGoogleGenerativeAI(
        model=model or settings.GEMINI_MODEL,
        temperature=temperature,
        streaming=streaming,
        google_api_key=api_key,
        max_output_tokens=4096,
        max_retries=0,
    )


def _build_groq(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_groq import ChatGroq
    api_key = _require_api_key("GROQ_API_KEY", "Groq")
    return ChatGroq(
        model=model or settings.GROQ_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=api_key,
    )


def _build_mistral(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_mistralai import ChatMistralAI
    api_key = _require_api_key("MISTRAL_API_KEY", "Mistral")
    return ChatMistralAI(
        model=model or settings.MISTRAL_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=api_key,
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
