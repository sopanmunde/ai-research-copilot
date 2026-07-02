"""
src/agents/langgraph/nodes/retriever_node.py — Retrieval Agent
==============================================================
Implements MMR-based retrieval from Pinecone vector store.
All results are user-scoped via metadata filtering.
"""
from typing import List, Dict
from src.agents.langgraph.state import AgentState
from src.rag.vectorstores.pinecone_store import get_mmr_retriever
from src.rag.retrieval.citation_retriever import format_citation
from src.core.constants import DEFAULT_TOP_K
from src.core.logger import get_logger

logger = get_logger(__name__)


async def retriever_node(state: AgentState) -> dict:
    """
    Retrieval Agent — queries Pinecone with MMR for diverse, relevant chunks.
    Respects the dynamic LLM selection for embedding generation.
    """
    plan = state.get("plan", [])
    query = state.get("query", "")
    user_id = state.get("user_id")
    provider = state.get("selected_llm_provider", "")
    model_name = state.get("selected_llm_model", "")
    workflow_type = state.get("workflow_type", "research")

    if not state.get("requires_context", True):
        logger.info("[Retrieval] requires_context=False — skipping retrieval")
        return {
            "retrieved_docs": [],
            "citations": [],
            "current_node": "retriever",
        }

    filename = state.get("filename")
    search_queries = plan if plan else [query]
    user_filter = {"user_id": user_id} if user_id else {}
    if filename:
        user_filter["filename"] = filename
    if not user_filter:
        user_filter = None

    logger.info(
        f"[Retrieval] workflow={workflow_type}, {len(search_queries)} queries, "
        f"provider={provider}, model={model_name or 'default'}, filename={filename or 'None'}"
    )

    retriever = get_mmr_retriever(top_k=DEFAULT_TOP_K, filter=user_filter)

    all_docs: List[Dict] = []
    all_citations: List[Dict] = []
    seen_doc_ids: set = set()

    import asyncio
    import hashlib

    async def fetch_docs(sq: str):
        try:
            return await asyncio.wait_for(retriever.ainvoke(sq), timeout=15.0)
        except asyncio.TimeoutError:
            logger.warning(f"[Retrieval] Timeout: '{sq[:60]}'")
            return []
        except Exception as e:
            logger.warning(f"[Retrieval] Error: '{sq[:60]}' — {e}")
            return []

    results = await asyncio.gather(*(fetch_docs(sq) for sq in search_queries))

    for docs in results:
        for i, doc in enumerate(docs):
            raw = (
                doc.metadata.get("filename", "")
                + str(doc.metadata.get("chunk_index", ""))
                + doc.page_content[:100]
            )
            doc_id = hashlib.sha1(raw.encode()).hexdigest()[:12]

            if doc_id in seen_doc_ids:
                continue
            seen_doc_ids.add(doc_id)

            all_docs.append({
                "page_content": doc.page_content,
                "metadata": doc.metadata,
                "doc_id": doc_id,
            })
            all_citations.append(format_citation(doc, len(all_citations)))

    logger.info(
        f"[Retrieval] {len(all_docs)} chunks, {len(all_citations)} citations"
    )

    return {
        "retrieved_docs": all_docs,
        "citations": all_citations,
        "current_node": "retriever",
    }
