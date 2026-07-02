"""
src/services/chat_service.py — Chat orchestration with SSE streaming
=====================================================================
Orchestrates both Quick Mode (direct LLM) and Agent Mode (LangGraph pipeline)
and emits Server-Sent Events for real-time frontend consumption.

SSE event protocol:
  {"node": "<name>", "status": "running"}       — agent activity update
  {"node": "<name>", "status": "completed"}      — agent finished
  {"type": "citations", "data": [...]}           — citation panel update
  {"type": "token", "data": "<text>"}            — streaming text token
  {"done": true, "sources": [...]}               — stream complete
  {"error": "<message>"}                         — error
"""
import json
from fastapi import Request
from typing import AsyncGenerator, Optional
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from src.agents.langgraph.graphs.factory import get_workflow_for_mode
from src.core.llm_factory import get_llm
from src.agents.langgraph.nodes.utils import extract_text
from src.rag.memory.conversation_memory import get_conversation_history
from src.database.mongodb.repositories.chat_repository import (
    insert_message,
    touch_conversation,
)
from src.core.logger import get_logger
from src.streaming import (
    sse_node_event,
    sse_token_event,
    sse_citations_event,
    sse_done_event,
    sse_error_event,
    sse_quality_score_event,
    sse_provider_switch_event,
)

logger = get_logger(__name__)

import asyncio
from typing import Set

active_queues: Set[asyncio.Queue] = set()
shutdown_event = asyncio.Event()

async def signal_sse_shutdown():
    shutdown_event.set()
    logger.info(f"Signaling {len(active_queues)} active SSE streams of shutdown...")
    for q in list(active_queues):
        await q.put("server_shutdown")


async def _stream_chat_response_impl(
    query: str,
    user_id: str,
    conversation_id: Optional[str],
    messages_collection,
    conversations_collection,
    mode: str = "agent",
    workflow_type: str = "research",
    model_provider: Optional[str] = None,
    model_name: Optional[str] = None,
    filename: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Orchestrates either Quick Mode or Agent Mode and yields SSE events.

    Args:
        mode: "quick" (direct LLM) or "agent" (LangGraph)
        workflow_type: research | summary | technical | competitive | coding | data_analysis
        model_provider: anthropic | google | groq | mistral
        model_name: Specific model name override
    """
    history = []
    if conversation_id:
        try:
            history = await get_conversation_history(
                messages_collection, conversation_id, limit=6,
            )
            if history and history[-1].get("role") == "user" and history[-1].get("content") == query:
                history.pop()
        except Exception as e:
            logger.warning(f"Could not load history for {conversation_id}: {e}")

    final_text = ""
    streamed_text = ""
    final_citations = []
    active_node = ""

    provider = model_provider or ""
    model = model_name or ""

    if mode == "quick":
        try:
            from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
            from src.core.llm_factory import get_fallback_providers, is_quota_error
            from src.core.logger import get_logger as _get_logger

            qlog = _get_logger("chat_service.quick")

            system_prompts = {
                "research": "You are a helpful, fast AI research assistant. Answer concisely and accurately.",
                "coding": "You are an expert software engineer. Provide clean, working code with explanations.",
                "data_analysis": "You are an expert data analyst. Provide clear analysis and insights.",
                "summary": "Provide a concise, well-structured summary.",
                "technical": "Provide detailed technical analysis with depth.",
                "competitive": "Provide comparative analysis of options.",
            }
            system_msg = system_prompts.get(workflow_type, system_prompts["research"])
            langchain_messages = [SystemMessage(content=system_msg)]

            for msg in history:
                if msg.get("role") == "user":
                    langchain_messages.append(HumanMessage(content=msg.get("content", "")))
                else:
                    langchain_messages.append(AIMessage(content=msg.get("content", "")))
            langchain_messages.append(HumanMessage(content=query))

            yield sse_node_event("direct_llm", "running")

            fallback_providers = get_fallback_providers(provider)
            qlog.info(f"Quick mode fallback chain: {fallback_providers}")

            streamed_text = ""
            succeeded = False

            for attempt_idx, attempt_provider in enumerate(fallback_providers):
                try:
                    if attempt_idx > 0:
                        prev = fallback_providers[attempt_idx - 1]
                        qlog.warning(f"Failing over from {prev} to {attempt_provider}")
                        yield sse_provider_switch_event(prev, attempt_provider, "quota_exhausted")

                    attempt_model = model if attempt_idx == 0 else ""
                    llm = get_llm(provider=attempt_provider, model_name=attempt_model, temperature=0.3)

                    async for chunk in llm.astream(langchain_messages):
                        if hasattr(chunk, "content") and chunk.content:
                            token = extract_text(chunk.content)
                            if not token:
                                continue
                            streamed_text += token
                            yield sse_token_event(token)

                    succeeded = True
                    break

                except Exception as e:
                    qlog.error(f"Quick mode provider '{attempt_provider}' error: {e}")
                    has_more = attempt_idx < len(fallback_providers) - 1

                    if has_more:
                        qlog.warning(f"{attempt_provider} failed, trying next provider")
                        continue

                    if is_quota_error(e):
                        err_msg = "AI quota exhausted on all available providers. Please check your billing plans."
                    elif "503" in str(e) or "unavailable" in str(e).lower():
                        err_msg = "AI provider experiencing high demand. Please try again."
                    else:
                        err_msg = f"AI provider error: {str(e)[:100]}"
                    streamed_text = err_msg
                    yield sse_token_event(err_msg)
                    succeeded = True
                    break

            yield sse_node_event("direct_llm", "completed")
            yield sse_done_event([])

            if conversation_id and streamed_text:
                try:
                    await insert_message(
                        conversation_id=conversation_id,
                        user_id=user_id,
                        role="assistant",
                        content=streamed_text,
                        sources=[],
                    )
                    await touch_conversation(conversation_id)
                except Exception as e:
                    logger.error(f"Failed to persist assistant message: {e}")
            return

        except Exception as e:
            logger.error(f"Quick mode fatal error: {e}", exc_info=True)
            yield sse_error_event(str(e))
            return

    graph = get_workflow_for_mode(workflow_type)

    initial_state = {
        "query": query,
        "conversation_id": conversation_id,
        "user_id": user_id,
        "filename": filename,
        "report_mode": False,
        "mode": mode,
        "workflow_type": workflow_type,
        "selected_llm_provider": provider or "",
        "selected_llm_model": model or "",
        "requires_context": True,
        "history": history,
        "messages": [],
        "plan": [],
        "retrieved_docs": [],
        "citations": [],
        "summary": "",
        "final_output": "",
        "generated_code": "",
        "code_review": "",
        "test_results": "",
        "analysis_results": "",
        "visualization_data": {},
        "errors": [],
        "current_node": "",
    }

    try:
        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event.get("event", "")
            name = event.get("name", "")
            data = event.get("data", {})

            if kind == "on_chain_start" and name in (
                "planner", "retriever", "citation", "summarizer", "reporter",
                "code_generation", "code_review", "testing", "data_analysis",
            ):
                active_node = name
                yield sse_node_event(name, "running")

            elif kind == "on_chain_end" and name in (
                "planner", "retriever", "citation", "summarizer", "reporter",
                "code_generation", "code_review", "testing", "data_analysis",
            ):
                yield sse_node_event(name, "completed")

                if name == "planner":
                    output = data.get("output", {})
                    if output.get("terminate") and output.get("final_output"):
                        final_text = output.get("final_output")
                        yield sse_token_event(final_text)

                elif name == "retriever":
                    output = data.get("output", {})
                    cits = output.get("citations", [])
                    if cits:
                        final_citations = cits
                        yield sse_citations_event(cits)

                elif name == "reporter":
                    output = data.get("output", {})
                    final_text = output.get("final_output", streamed_text)
                    final_citations = output.get("citations", final_citations)

                    if not streamed_text and final_text:
                        yield sse_token_event(final_text)

                    quality_score = output.get("quality_score")
                    if quality_score:
                        yield sse_quality_score_event(quality_score)

            elif kind == "on_chat_model_stream":
                langgraph_node = event.get("metadata", {}).get("langgraph_node", active_node)
                if langgraph_node in ("planner", "retriever", "citation"):
                    continue

                chunk = data.get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    token = extract_text(chunk.content)
                    if not token:
                        continue
                    streamed_text += token
                    yield sse_token_event(token)

            elif kind == "on_custom_event":
                if name == "provider_switch":
                    yield sse_provider_switch_event(
                        data.get("from", ""), data.get("to", ""), data.get("reason", "")
                    )

        yield sse_done_event(final_citations)

        persist_text = final_text or streamed_text
        if conversation_id and persist_text:
            try:
                await insert_message(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role="assistant",
                    content=persist_text,
                    sources=final_citations,
                )
                await touch_conversation(conversation_id)
            except Exception as e:
                logger.error(f"Failed to persist assistant message: {e}")

    except Exception as e:
        logger.error(f"Agent mode error: {e}", exc_info=True)
        yield sse_error_event(str(e))


async def stream_chat_response(
    query: str,
    user_id: str,
    conversation_id: Optional[str],
    messages_collection,
    conversations_collection,
    mode: str = "agent",
    workflow_type: str = "research",
    model_provider: Optional[str] = None,
    model_name: Optional[str] = None,
    http_request: Optional[Request] = None,
    filename: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Orchestrates Quick Mode or Agent Mode and yields SSE events.
    Gracefully handles shutdown signaling via active queue event delivery.
    """
    queue = asyncio.Queue()
    active_queues.add(queue)

    async def producer():
        try:
            async for chunk in _stream_chat_response_impl(
                query=query,
                user_id=user_id,
                conversation_id=conversation_id,
                messages_collection=messages_collection,
                conversations_collection=conversations_collection,
                mode=mode,
                workflow_type=workflow_type,
                model_provider=model_provider,
                model_name=model_name,
                filename=filename,
            ):
                await queue.put(chunk)
            await queue.put(None)  # Sentinel for success
        except Exception as e:
            await queue.put(e)  # Sentinel for exception

    producer_task = asyncio.create_task(producer())

    try:
        while True:
            if http_request and await http_request.is_disconnected():
                logger.info("[Chat] Client disconnected. Cleaning up SSE stream.")
                break

            try:
                item = await asyncio.wait_for(queue.get(), timeout=0.05)
            except asyncio.TimeoutError:
                continue

            if item is None:
                break
            if isinstance(item, Exception):
                raise item
            if item == "server_shutdown":
                yield f"data: {json.dumps({'type': 'server_shutdown', 'message': 'Server shutting down. Please try again later.'})}\n\n"
                break
            yield item
    finally:
        active_queues.discard(queue)
        if not producer_task.done():
            producer_task.cancel()
            try:
                await producer_task
            except asyncio.CancelledError:
                pass
