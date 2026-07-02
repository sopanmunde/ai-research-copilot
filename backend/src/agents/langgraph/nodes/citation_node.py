"""
src/agents/langgraph/nodes/citation_node.py — Citation Agent
============================================================
De-duplicates citations by doc_id, applies confidence scoring,
and ensures consistent citation structure for the frontend.
"""
from src.agents.langgraph.state import AgentState
from src.core.logger import get_logger

logger = get_logger(__name__)


async def citation_node(state: AgentState) -> dict:
    """
    Citation Agent — enriches, deduplicates, and ranks citation metadata.
    Respects workflow_type: coding and data_analysis skip citation processing.
    """
    workflow_type = state.get("workflow_type", "research")

    if workflow_type in ("coding", "data_analysis"):
        return {"citations": [], "current_node": "citation"}

    existing_citations = state.get("citations", [])
    docs = state.get("retrieved_docs", [])

    if existing_citations:
        seen_ids: set = set()
        enriched: list = []
        for cit in existing_citations:
            doc_id = cit.get("doc_id", cit.get("source", "") + str(cit.get("page", "")))
            if doc_id in seen_ids:
                continue
            seen_ids.add(doc_id)
            rank = len(enriched) + 1
            enriched.append({
                **cit,
                "rank": rank,
                "confidence": round(max(0.95 - (rank - 1) * 0.05, 0.50), 2),
            })

        logger.info(
            f"[Citation] {len(enriched)} citations "
            f"({len(existing_citations) - len(enriched)} dupes removed)"
        )
        return {"citations": enriched, "current_node": "citation"}

    citations: list = []
    seen: set = set()
    for i, doc in enumerate(docs):
        meta = doc.get("metadata", {})
        source = meta.get("filename", meta.get("source", "Unknown"))
        page = meta.get("page", "N/A")
        doc_id = doc.get("doc_id", f"{source}::{page}::{i}")

        if doc_id in seen:
            continue
        seen.add(doc_id)

        rank = len(citations) + 1
        citations.append({
            "index": rank,
            "rank": rank,
            "doc_id": doc_id,
            "source": source,
            "filename": source,
            "page": page,
            "chunk_index": meta.get("chunk_index", "N/A"),
            "total_chunks": meta.get("total_chunks", "N/A"),
            "uploaded_at": meta.get("uploaded_at", ""),
            "snippet": doc["page_content"][:200].strip(),
            "confidence": round(max(0.95 - (rank - 1) * 0.05, 0.50), 2),
        })

    logger.info(f"[Citation] Generated {len(citations)} citations (fallback)")
    return {"citations": citations, "current_node": "citation"}
