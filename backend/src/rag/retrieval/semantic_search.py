"""
src/rag/retrieval/semantic_search.py — MMR semantic retrieval
==============================================================
Implements the "Retrieve — Semantic MMR rerank" step from the image workflow.

IMPORTANT: This uses MMR (Maximal Marginal Relevance), NOT plain similarity.
MMR balances relevance with diversity — it avoids returning near-duplicate
chunks and surfaces a broader set of evidence for the LLM to reason over.
"""
from typing import List, Optional, Dict
from langchain_core.documents import Document
from rag.vectorstores.pinecone_store import get_mmr_retriever
from core.logger import get_logger

logger = get_logger(__name__)


async def semantic_search(
    query: str,
    top_k: int = 6,
    filter: Optional[Dict] = None,
) -> List[Document]:
    """
    Run an MMR-based semantic search against Pinecone.

    Uses Maximal Marginal Relevance (lambda_mult=0.6) to:
    - Retrieve a 3× candidate pool
    - Re-rank selecting the most relevant yet diverse chunks

    Args:
        query:  The search query string.
        top_k:  Number of final chunks to return after MMR reranking.
        filter: Optional Pinecone metadata filter dict (e.g. {"user_id": "..."}).

    Returns:
        List of LangChain Documents ranked by MMR score.
    """
    retriever = get_mmr_retriever(top_k=top_k, filter=filter)
    docs = await retriever.ainvoke(query)
    logger.info(
        f"MMR semantic search '{query[:60]}' → {len(docs)} results "
        f"(top_k={top_k}, filter={'set' if filter else 'none'})"
    )
    return docs
