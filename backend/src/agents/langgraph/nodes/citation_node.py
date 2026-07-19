"""
src/agents/langgraph/nodes/citation_node.py — Citation Agent
============================================================
De-duplicates citations by doc_id, applies dynamic confidence scoring,
and ensures consistent citation structure for the frontend.
"""
from typing import List
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage
from src.agents.langgraph.state import AgentState
from src.core.logger import get_logger

logger = get_logger(__name__)


class CitationRelevanceScorer(BaseModel):
    relevance_scores: List[float] = Field(
        description="Relevance scores between 0.0 and 1.0 for each of the provided snippet chunks, in the exact same order."
    )


def compute_keyword_similarity(query: str, snippet: str) -> float:
    """Fallback token-overlap similarity calculation between query and snippet."""
    q_words = set(query.lower().split())
    s_words = set(snippet.lower().split())
    if not q_words:
        return 0.5
    overlap = q_words.intersection(s_words)
    # calculate Jaccard-like index or overlap ratio
    score = len(overlap) / min(len(q_words), 10) # score matches, capped at 10 words
    return round(min(0.50 + score * 0.45, 0.95), 2)


async def evaluate_citations_relevance(
    query: str, snippets: List[str], provider: str, model_name: str
) -> List[float]:
    """Score the relevance of retrieved document snippets to the user query using the LLM or a fallback scorer."""
    if not snippets:
        return []

    clean_snippets = [s.strip() for s in snippets]
    if not any(clean_snippets):
        return [0.50] * len(snippets)

    prompt = (
        "You are an expert citation relevance evaluator. You are given a user query and a list of text snippets "
        "retrieved from documents. Your job is to assign a relevance score between 0.0 and 1.0 to each snippet. "
        "A score of 1.0 means the snippet perfectly and directly answers the query. A score of 0.0 means the snippet is completely irrelevant. "
        "Be objective and strict. Return scores matching the order of snippets.\n\n"
        f"User Query: \"{query}\"\n\n"
        "Snippets to evaluate:\n"
    )
    for idx, snip in enumerate(snippets):
        prompt += f"Snippet {idx+1}: {snip[:250]}\n---\n"

    try:
        from src.core.llm_factory import get_llm
        llm = get_llm(provider=provider, model_name=model_name, temperature=0.0)
        structured_llm = llm.with_structured_output(CitationRelevanceScorer)
        result = await structured_llm.ainvoke([SystemMessage(content=prompt)])
        if result and hasattr(result, "relevance_scores") and len(result.relevance_scores) == len(snippets):
            return [round(s, 2) for s in result.relevance_scores]
    except Exception as e:
        logger.warning(
            f"[Citation] Failed to score citations using LLM structured output: {e}. "
            f"Falling back to token similarity."
        )

    # Fallback: token matching
    scores = []
    for snip in snippets:
        scores.append(compute_keyword_similarity(query, snip))
    return scores


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
    query = state.get("query", "")
    provider = state.get("selected_llm_provider", "")
    model_name = state.get("selected_llm_model", "")

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
            })

        snippets = [cit.get("snippet", "") for cit in enriched]
        scores = await evaluate_citations_relevance(query, snippets, provider, model_name)
        for idx, cit in enumerate(enriched):
            cit["confidence"] = scores[idx] if idx < len(scores) else round(max(0.95 - idx * 0.05, 0.50), 2)

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
            "url": meta.get("url"),
            "chunk_index": meta.get("chunk_index", "N/A"),
            "total_chunks": meta.get("total_chunks", "N/A"),
            "uploaded_at": meta.get("uploaded_at", ""),
            "snippet": doc["page_content"][:200].strip(),
        })

    snippets = [cit.get("snippet", "") for cit in citations]
    scores = await evaluate_citations_relevance(query, snippets, provider, model_name)
    for idx, cit in enumerate(citations):
        cit["confidence"] = scores[idx] if idx < len(scores) else round(max(0.95 - idx * 0.05, 0.50), 2)

    logger.info(f"[Citation] Generated {len(citations)} citations (fallback)")
    return {"citations": citations, "current_node": "citation"}
