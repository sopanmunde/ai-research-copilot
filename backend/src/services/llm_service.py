"""LLM Service — backward-compatible wrapper around the multi-LLM factory."""
from functools import lru_cache
from langchain_core.language_models.chat_models import BaseChatModel
from core.llm_factory import get_llm
from core.config import settings
from core.logger import get_logger

logger = get_logger(__name__)


@lru_cache(maxsize=8)
def get_chat_llm(
    provider: str = "",
    model_name: str = "",
    temperature: float = 0.2,
) -> BaseChatModel:
    """
    Returns a cached LangChain chat model for the given provider.

    Args:
        provider: 'anthropic' | 'google' | 'groq' | 'mistral'
                  Leave empty for DEFAULT_LLM_PROVIDER.
        model_name: Override the default model for the provider.
        temperature: Sampling temperature.

    Returns:
        A BaseChatModel instance configured with streaming enabled.
    """
    provider = provider or settings.DEFAULT_LLM_PROVIDER
    model = model_name or ""
    logger.info(f"LLM: provider={provider}, model={model or 'default'}")
    return get_llm(
        provider=provider,
        model_name=model,
        temperature=temperature,
        streaming=True,
    )
