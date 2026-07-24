"""Pinecone vector store — upgraded with MMR, metadata filtering, and namespaces.

Uses the dynamic embeddings provider from settings.EMBEDDING_PROVIDER."""
from functools import lru_cache
from typing import List, Optional, Dict, Any
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from rag.embeddings.google_embeddings import get_embeddings
from core.config import settings
from core.logger import get_logger

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def get_vector_store() -> PineconeVectorStore:
    """Returns a cached Pinecone vector store instance with dynamic embeddings."""
    logger.info(
        f"Connecting to Pinecone index: {settings.PINECONE_INDEX_NAME} "
        f"(embedding_provider={settings.EMBEDDING_PROVIDER})"
    )
    import os
    if settings.PINECONE_API_KEY:
        os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY

    return PineconeVectorStore.from_existing_index(
        index_name=settings.PINECONE_INDEX_NAME,
        embedding=get_embeddings(),
    )


def get_semantic_retriever(top_k: int = None, filter: Optional[Dict] = None):
    """Standard semantic similarity retriever with optional metadata filter."""
    from core.constants import DEFAULT_TOP_K
    k = top_k or DEFAULT_TOP_K
    store = get_vector_store()
    search_kwargs: Dict[str, Any] = {"k": k}
    if filter:
        search_kwargs["filter"] = filter
    return store.as_retriever(search_type="similarity", search_kwargs=search_kwargs)


def get_mmr_retriever(top_k: int = None, filter: Optional[Dict] = None):
    """
    MMR (Maximal Marginal Relevance) retriever — balances relevance and diversity.
    Reduces redundancy in retrieved chunks.
    """
    from core.constants import DEFAULT_TOP_K, MMR_LAMBDA
    k = top_k or DEFAULT_TOP_K
    store = get_vector_store()
    search_kwargs: Dict[str, Any] = {
        "k": k,
        "fetch_k": k * 3,
        "lambda_mult": MMR_LAMBDA,
    }
    if filter:
        search_kwargs["filter"] = filter
    return store.as_retriever(search_type="mmr", search_kwargs=search_kwargs)


def add_documents(documents: List[Document]) -> None:
    """Index new documents into Pinecone."""
    store = get_vector_store()
    store.add_documents(documents)
    logger.info(f"Indexed {len(documents)} chunks into Pinecone")


def delete_by_filename(user_id: str, filename: str) -> bool:
    """Delete all chunks for a specific user and filename."""
    store = get_vector_store()
    try:
        index = store.index  # Use property instead of get_pinecone_index
        index.delete(filter={"user_id": user_id, "filename": filename})
        logger.info(f"Deleted chunks from Pinecone for user={user_id}, filename={filename}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete from Pinecone (user={user_id}, filename={filename}): {e}")
        return False
