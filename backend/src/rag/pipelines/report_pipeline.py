"""
src/rag/pipelines/report_pipeline.py — Structured research report generation
=============================================================================
Implements the Report service flow from the image workflow.
Generates a full markdown research report from Pinecone-retrieved context.

Uses the 5-section report structure:
  Executive Summary → Key Findings → Detailed Analysis → Conclusions → References
"""
from typing import List, Dict, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from rag.retrieval.citation_retriever import retrieve_with_citations
from rag.pipelines.rag_pipeline import build_context_string
from core.logger import get_logger

logger = get_logger(__name__)

REPORT_PROMPT = """You are an expert AI Research Report Generator.

Using ONLY the provided document context, generate a comprehensive, structured
research report. Do not add information beyond what is in the context.

Required report structure (use these exact markdown headers):

# {query}

## Executive Summary
(2–3 sentence high-level overview of what the documents reveal)

## Key Findings
(Bulleted list of the most important insights, each cited with [Source: file, Page X])

## Detailed Analysis
(Multiple paragraphs expanding on each finding with evidence and reasoning.
Cite all claims inline as [Source: filename, Page X])

## Conclusions
(Synthesized takeaways — what this research means, limitations noted)

## 📚 References
(Numbered list of all cited sources with full metadata)

---
STYLE GUIDE:
- Professional research paper tone
- Every factual claim must be cited
- Use > blockquotes for direct quotes from documents
- Use **bold** for key terms and findings
- Acknowledge gaps where context is insufficient

DOCUMENT CONTEXT:
{context}"""


async def generate_report(
    query: str,
    llm,
    top_k: int = 10,
    user_filter: Optional[Dict] = None,
) -> Dict:
    """
    Generate a full structured research report from Pinecone-retrieved context.

    Args:
        query:       The research question / topic.
        llm:         An instantiated LangChain chat model (GPT-4o recommended).
        top_k:       Number of chunks to retrieve (default 10 for reports).
        user_filter: Pinecone metadata filter (e.g. {"user_id": "..."}).

    Returns:
        {"report": str, "citations": List[Dict], "query": str, "chunk_count": int}
    """
    logger.info(f"Generating research report for: '{query[:60]}'")

    docs, citations = await retrieve_with_citations(
        query=query, top_k=top_k, filter=user_filter
    )

    if not docs:
        logger.warning(f"No documents retrieved for report query: '{query[:60]}'")
        return {
            "report": (
                f"# {query}\n\n"
                "> ⚠️ No relevant documents were found in the knowledge base "
                "to generate this report. Please upload relevant documents first."
            ),
            "citations": [],
            "query": query,
            "chunk_count": 0,
        }

    context_str = build_context_string(docs)
    messages = [
        SystemMessage(
            content=REPORT_PROMPT.format(context=context_str, query=query)
        ),
        HumanMessage(content=f"Generate the research report for: {query}"),
    ]

    response = await llm.ainvoke(messages)

    logger.info(
        f"Report generated: {len(response.content)} chars, "
        f"{len(citations)} citations, {len(docs)} source chunks"
    )

    return {
        "report": response.content,
        "citations": citations,
        "query": query,
        "chunk_count": len(docs),
    }
