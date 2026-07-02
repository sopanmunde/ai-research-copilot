"""
src/rag/pipelines/rag_pipeline.py — Core RAG pipeline (chat mode)
=================================================================
Implements the full "Retrieve → Generate" flow for direct (non-agent) calls.
Used by the report pipeline and any direct RAG calls outside LangGraph.

Pipeline steps (matching image workflow):
  Retrieve (Semantic MMR rerank) → Build context → Generate (GPT-4o + citations)
"""
from typing import List, Dict, Any, Optional
from langchain_core.documents import Document
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from src.rag.retrieval.citation_retriever import retrieve_with_citations
from src.core.logger import get_logger

logger = get_logger(__name__)

RAG_SYSTEM_PROMPT = """You are an expert AI Research Analyst.

Answer the user's question using ONLY the provided document context below.
Your response must be grounded in the retrieved evidence — do not hallucinate.

RULES:
- Cite sources inline using: [Source: filename, Page X]
- Use markdown formatting: headers (##), bullets, **bold** key terms
- If context is insufficient: "The provided documents do not address this question."
- Include a "## 📚 References" section at the end listing all cited sources
- Be concise and analytical — avoid padding or generic statements

Context:
{context}"""


def build_context_string(docs: List[Document]) -> str:
    """
    Format retrieved LangChain Documents into a numbered context block.
    Used by both the chat and report pipelines.
    """
    if not docs:
        return "No documents retrieved."

    parts = []
    for i, doc in enumerate(docs):
        meta = doc.metadata
        source = meta.get("filename", meta.get("source", f"Document {i + 1}"))
        page = meta.get("page", "")
        page_str = f" — Page {page}" if page not in ("", "N/A", None) else ""
        parts.append(f"[{i + 1}] **{source}**{page_str}\n{doc.page_content}")

    return "\n\n---\n\n".join(parts)


async def run_rag_pipeline(
    query: str,
    llm,
    top_k: int = 6,
    history: Optional[List[Dict]] = None,
    user_filter: Optional[Dict] = None,
) -> Dict[str, Any]:
    """
    Direct RAG pipeline (bypasses LangGraph agents):
      1. Retrieve with MMR citations from Pinecone
      2. Build context string
      3. Inject conversation history
      4. Generate with GPT-4o
      5. Return answer + citations + source docs

    Returns:
        {"answer": str, "citations": List[Dict], "docs": List[Document]}
    """
    docs, citations = await retrieve_with_citations(
        query=query, top_k=top_k, filter=user_filter
    )
    context_str = build_context_string(docs)

    messages = [SystemMessage(content=RAG_SYSTEM_PROMPT.format(context=context_str))]

    for turn in (history or [])[-6:]:
        role = turn.get("role", "")
        content = turn.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=query))

    response = await llm.ainvoke(messages)
    logger.info(
        f"RAG pipeline complete: '{query[:60]}' → "
        f"{len(docs)} docs, {len(citations)} citations"
    )

    return {
        "answer": response.content,
        "citations": citations,
        "docs": docs,
    }
