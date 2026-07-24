"""
src/rag/retrieval/citation_retriever.py — Citation-enriched MMR retrieval
=========================================================================
Wraps semantic_search (MMR) and attaches structured citation metadata
to each retrieved chunk for display in the frontend citation panel.
"""
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from langchain_core.documents import Document
from rag.retrieval.semantic_search import semantic_search
from core.logger import get_logger

logger = get_logger(__name__)


def _make_doc_id(doc: Document) -> str:
    """
    Generate a deterministic short ID for a document chunk.
    Used by the frontend to deduplicate citations across multiple queries.
    """
    raw = (
        doc.metadata.get("filename", "")
        + str(doc.metadata.get("chunk_index", ""))
        + doc.page_content[:100]
    )
    return hashlib.sha1(raw.encode()).hexdigest()[:12]


def format_citation(doc: Document, index: int) -> Dict[str, Any]:
    """
    Extract and format structured citation metadata from a document chunk.

    Fields returned:
        index        — 1-based position in retrieved list
        doc_id       — deterministic content hash (for frontend dedup)
        source       — display name for the source (filename preferred)
        filename     — original upload filename
        page         — page number (or "N/A")
        chunk_index  — chunk position within the original document
        uploaded_at  — ISO timestamp of when the doc was ingested
        snippet      — first 200 chars of the chunk content
        confidence   — rank-based confidence score (0.50–0.95)
    """
    meta = doc.metadata
    confidence = round(max(0.95 - index * 0.05, 0.50), 2)
    return {
        "index": index + 1,
        "doc_id": _make_doc_id(doc),
        "source": meta.get("filename", meta.get("source", f"Document {index + 1}")),
        "filename": meta.get("filename", "Unknown"),
        "page": meta.get("page", "N/A"),
        "chunk_index": meta.get("chunk_index", "N/A"),
        "total_chunks": meta.get("total_chunks", "N/A"),
        "uploaded_at": meta.get("uploaded_at", ""),
        "snippet": doc.page_content[:200].strip(),
        "confidence": confidence,
    }


async def retrieve_with_citations(
    query: str,
    top_k: int = 6,
    filter: Optional[Dict] = None,
) -> Tuple[List[Document], List[Dict]]:
    """
    Retrieve documents via MMR and generate citation metadata for each.

    Returns:
        (documents, citations) — parallel lists, same order as retrieval.
    """
    docs = await semantic_search(query=query, top_k=top_k, filter=filter)
    citations = [format_citation(doc, i) for i, doc in enumerate(docs)]
    logger.info(
        f"Retrieved {len(docs)} docs with citations for '{query[:60]}'"
    )
    return docs, citations
