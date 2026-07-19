"""
src/streaming/__init__.py — Streaming event helpers for SSE
============================================================
Provides utility functions for Server-Sent Events used by both
Quick Mode (direct LLM) and Agent Mode (LangGraph) streaming.
"""
import json
from typing import AsyncGenerator, Any


def sse_node_event(node_name: str, status: str, output: Any = None) -> str:
    """Format a node lifecycle event for SSE."""
    payload = {"node": node_name, "status": status}
    if output is not None:
        payload["output"] = output
    return f"data: {json.dumps(payload)}\n\n"


def sse_token_event(token: str) -> str:
    """Format a token event for SSE streaming."""
    return f"data: {json.dumps({'type': 'token', 'data': token, 'text': token})}\n\n"


def sse_citations_event(citations: list) -> str:
    """Format a citations event for SSE."""
    return f"data: {json.dumps({'type': 'citations', 'data': citations})}\n\n"


def sse_done_event(sources: list = None, source_heatmap: list = None) -> str:
    """Format a done event for SSE."""
    payload = {"done": True, "sources": sources or []}
    if source_heatmap is not None:
        payload["source_heatmap"] = source_heatmap
    return f"data: {json.dumps(payload)}\n\n"


def sse_error_event(error: str) -> str:
    """Format an error event for SSE."""
    return f"data: {json.dumps({'error': error})}\n\n"


def sse_quality_score_event(score: dict) -> str:
    """Format a quality score event for SSE."""
    return f"data: {json.dumps({'type': 'quality_score', 'data': score})}\n\n"


def sse_provider_switch_event(from_provider: str, to_provider: str, reason: str) -> str:
    """Format a provider failover event for SSE."""
    return f"data: {json.dumps({'type': 'provider_switch', 'from': from_provider, 'to': to_provider, 'reason': reason})}\n\n"


async def stream_tokens(llm, messages, streamed_text: list) -> AsyncGenerator[str, None]:
    """
    Generic token streamer that works with any LangChain chat model.
    Yields SSE token events and accumulates text.

    Args:
        llm: A BaseChatModel instance
        messages: List of BaseMessage
        streamed_text: Mutable list to accumulate the full text

    Yields:
        SSE-formatted token event strings
    """
    async for chunk in llm.astream(messages):
        if hasattr(chunk, "content") and chunk.content:
            token = chunk.content
            if isinstance(token, list):
                token = "".join(
                    b.get("text", "") if isinstance(b, dict) else str(b)
                    for b in token
                )
            if not token:
                continue
            streamed_text[0] += token
            yield sse_token_event(token)
