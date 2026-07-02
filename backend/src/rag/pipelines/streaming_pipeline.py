"""Async streaming RAG pipeline — yields tokens via async generator."""
from typing import AsyncGenerator, List, Dict, Optional
from langchain_core.documents import Document
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from src.rag.retrieval.citation_retriever import retrieve_with_citations
from src.rag.pipelines.rag_pipeline import build_context_string, RAG_SYSTEM_PROMPT
from src.core.logger import get_logger

logger = get_logger(__name__)


async def stream_rag_response(
    query: str,
    llm,
    top_k: int = 6,
    history: Optional[List[Dict]] = None,
    user_filter: Optional[Dict] = None,
) -> AsyncGenerator[Dict, None]:
    """
    Streaming RAG pipeline.
    Yields:
      {"type": "citations", "data": [...]}    — emitted first
      {"type": "token", "data": "..."}         — streamed tokens
      {"type": "done"}                         — signals completion
    """
    docs, citations = await retrieve_with_citations(query=query, top_k=top_k, filter=user_filter)
    context_str = build_context_string(docs)

    yield {"type": "citations", "data": citations}

    messages = [SystemMessage(content=RAG_SYSTEM_PROMPT.format(context=context_str))]
    for h in (history or [])[-6:]:
        if h["role"] == "user":
            messages.append(HumanMessage(content=h["content"]))
        elif h["role"] == "assistant":
            messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=query))

    full_response = ""
    async for chunk in llm.astream(messages):
        token = chunk.content
        full_response += token
        yield {"type": "token", "data": token}

    yield {"type": "done", "full_response": full_response, "citations": citations}
    logger.info(f"Streaming RAG complete for '{query[:60]}' — {len(full_response)} chars")
