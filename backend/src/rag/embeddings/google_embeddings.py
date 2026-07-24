"""
src/rag/embeddings/google_embeddings.py — Embeddings factory
============================================================
Supports multiple embedding providers: google, huggingface.
The selected provider reads from settings.EMBEDDING_PROVIDER and
settings.EMBEDDING_MODEL.
"""
from functools import lru_cache
from typing import List, Optional
from langchain_core.embeddings import Embeddings
from core.logger import get_logger
from core.config import settings

logger = get_logger(__name__)

PINECONE_INDEX_DIMENSION = 384


class FixedDimensionEmbeddings(Embeddings):
    """
    Wraps an Embeddings instance to enforce output_dimensionality.
    Used when the underlying model supports configurable dimensions.
    """
    def __init__(self, inner: Embeddings, dimension: int = PINECONE_INDEX_DIMENSION):
        self._inner = inner
        self._dimension = dimension

    def embed_query(self, text: str) -> List[float]:
        vec = self._inner.embed_query(text)
        return self._trim_or_pad(vec)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        vecs = self._inner.embed_documents(texts)
        return [self._trim_or_pad(v) for v in vecs]

    async def aembed_query(self, text: str) -> List[float]:
        vec = await self._inner.aembed_query(text)
        return self._trim_or_pad(vec)

    async def aembed_documents(self, texts: List[str]) -> List[List[float]]:
        vecs = await self._inner.aembed_documents(texts)
        return [self._trim_or_pad(v) for v in vecs]

    def _trim_or_pad(self, vec: List[float]) -> List[float]:
        if len(vec) > self._dimension:
            return vec[:self._dimension]
        elif len(vec) < self._dimension:
            return vec + [0.0] * (self._dimension - len(vec))
        return vec


@lru_cache(maxsize=1)
def get_embeddings() -> Embeddings:
    """
    Returns a cached Embeddings instance based on settings.EMBEDDING_PROVIDER.

    Supported providers:
      - google: GoogleGenerativeAIEmbeddings (default, dim=384)
      - huggingface: HuggingFaceEmbeddings (dim=384)
    """
    provider = (settings.EMBEDDING_PROVIDER or "google").lower().strip()
    model_name = settings.EMBEDDING_MODEL or "models/gemini-embedding-001"
    dimension = settings.EMBEDDING_DIMENSION or PINECONE_INDEX_DIMENSION

    logger.info(f"Initializing embeddings: provider={provider}, model={model_name}, dim={dimension}")

    if provider == "huggingface":
        return _build_huggingface_embeddings(model_name, dimension)
    else:
        return _build_google_embeddings(model_name, dimension)


def _build_google_embeddings(model_name: str, dimension: int) -> Embeddings:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    if not settings.GOOGLE_API_KEY:
        raise RuntimeError("GOOGLE_API_KEY is not set. Add it to your .env file.")

    class GoogleEmbeddingsAdapter(GoogleGenerativeAIEmbeddings):
        def embed_query(self, text: str, **kwargs) -> List[float]:
            return super().embed_query(text, output_dimensionality=dimension, **kwargs)
        def embed_documents(self, texts: List[str], **kwargs) -> List[List[float]]:
            return super().embed_documents(texts, output_dimensionality=dimension, **kwargs)
        async def aembed_query(self, text: str, **kwargs) -> List[float]:
            return await super().aembed_query(text, output_dimensionality=dimension, **kwargs)
        async def aembed_documents(self, texts: List[str], **kwargs) -> List[List[float]]:
            return await super().aembed_documents(texts, output_dimensionality=dimension, **kwargs)

    return GoogleEmbeddingsAdapter(
        model=model_name,
        google_api_key=settings.GOOGLE_API_KEY,
    )



def _build_huggingface_embeddings(model_name: str, dimension: int) -> Embeddings:
    from langchain_community.embeddings import HuggingFaceEmbeddings

    raw = HuggingFaceEmbeddings(
        model_name=model_name or "sentence-transformers/all-MiniLM-L12-v2",
    )
    return FixedDimensionEmbeddings(raw, dimension)
