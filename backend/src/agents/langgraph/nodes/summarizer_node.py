"""
src/agents/langgraph/nodes/summarizer_node.py — Summary Agent
=============================================================
Synthesizes retrieved document chunks (or LLM knowledge) into a clear,
well-cited markdown answer using the dynamically selected LLM.
Supports automatic provider failover on quota errors.
"""
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.callbacks.manager import adispatch_custom_event
from src.agents.langgraph.state import AgentState
from src.core.llm_factory import get_llm, get_fallback_providers
from src.agents.langgraph.nodes.utils import extract_text
from src.core.logger import get_logger

logger = get_logger(__name__)

SUMMARIZER_SYSTEM_RESEARCH = """You are an expert AI Research Analyst (Summary Agent).

Your task is to synthesize retrieved document chunks into a clear, accurate,
well-cited answer to the user's research question.

STRICT RULES:
1. Base your answer ONLY on the provided document context below.
2. NEVER hallucinate or add information not present in the documents.
3. If the context does not contain enough information, say so explicitly.
4. Cite sources inline using ONLY their corresponding numeric bracket, e.g. [1], [2]. Do NOT use filenames or the word "Source" in citations.
5. Use proper markdown formatting.
6. Consider the conversation history to maintain continuity.

CONTEXT (retrieved document chunks):
{context}"""

SUMMARIZER_SYSTEM_SIMPLE = """You are TriVisionX, a helpful and knowledgeable AI assistant.

Answer the user's question directly and clearly based on your own knowledge.
Do not mention documents or retrieval — just give a helpful, well-structured response.

RULES:
1. Be concise but thorough.
2. Use markdown formatting where helpful.
3. Consider the conversation history to maintain continuity."""

SUMMARIZER_SYSTEM_CODING = """You are an expert Software Engineer and Code Assistant.

Your task is to help the user with coding, development, and technical problems.

RULES:
1. Write clean, well-structured code with proper error handling.
2. Explain your approach before showing code.
3. Use appropriate code blocks with language annotations.
4. Consider edge cases and best practices.
5. If the user's request is ambiguous, ask clarifying questions.
6. Reference conversation history for context."""

SUMMARIZER_SYSTEM_DATA_ANALYSIS = """You are an expert Data Analyst and Data Scientist.

Your task is to help analyze data, generate insights, and produce visualizations.

RULES:
1. Provide clear, actionable insights from the data.
2. Suggest appropriate visualizations and analysis techniques.
3. Use markdown tables for presenting data.
4. Explain statistical concepts in plain language.
5. Reference conversation history for context."""


def _build_context(docs: list) -> str:
    """Format retrieved doc dicts into a numbered, readable context block."""
    if not docs:
        return "No documents were retrieved for this query."

    parts = []
    for i, doc in enumerate(docs):
        meta = doc.get("metadata", {})
        source = meta.get("filename", meta.get("source", f"Document {i + 1}"))
        page = meta.get("page", "")
        chunk_idx = meta.get("chunk_index", "")
        header = f"[{i + 1}] {source}"
        if page not in ("", "N/A", None):
            header += f" — Page {page}"
        if chunk_idx not in ("", "N/A", None):
            header += f" (chunk {chunk_idx})"
        parts.append(f"{header}:\n{doc['page_content']}")

    return "\n\n---\n\n".join(parts)


async def summarizer_node(state: AgentState) -> dict:
    """
    Summary Agent — synthesizes a high-quality answer using the dynamic LLM.
    Adapts the system prompt based on workflow_type.
    Automatically fails over to the next configured provider on quota errors.
    """
    query = state.get("query", "")
    docs = state.get("retrieved_docs", [])
    history = state.get("history", [])
    workflow_type = state.get("workflow_type", "research")
    provider = state.get("selected_llm_provider", "")
    model_name = state.get("selected_llm_model", "")
    requires_context = state.get("requires_context", False)

    logger.info(
        f"[Summarizer] workflow={workflow_type}, provider={provider}, "
        f"docs={len(docs)}, history={len(history)} turns"
    )

    if workflow_type == "coding":
        system_prompt = SUMMARIZER_SYSTEM_CODING
        history_turns = 6
    elif workflow_type == "data_analysis":
        system_prompt = SUMMARIZER_SYSTEM_DATA_ANALYSIS
        history_turns = 6
    elif requires_context and docs:
        context = _build_context(docs)
        system_prompt = SUMMARIZER_SYSTEM_RESEARCH.format(context=context)
        history_turns = 6
    else:
        system_prompt = SUMMARIZER_SYSTEM_SIMPLE
        history_turns = 6

    messages = [SystemMessage(content=system_prompt)]

    for turn in history[-history_turns:]:
        role = turn.get("role", "")
        content = turn.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=query))

    fallback_providers = get_fallback_providers(provider)
    logger.info(f"[Summarizer] fallback chain: {fallback_providers}")

    summary_text = ""
    last_error: Exception | None = None

    for attempt_idx, attempt_provider in enumerate(fallback_providers):
        try:
            if attempt_idx > 0:
                logger.warning(f"[Summarizer] failing over: {fallback_providers[attempt_idx-1]} -> {attempt_provider}")

            attempt_model = model_name if attempt_idx == 0 else ""

            if workflow_type == "coding":
                llm = get_llm(provider=attempt_provider, model_name=attempt_model or "gpt-4o-mini", temperature=0.2)
            elif workflow_type == "data_analysis":
                llm = get_llm(provider=attempt_provider, model_name=attempt_model, temperature=0.2)
            elif requires_context and docs:
                llm = get_llm(provider=attempt_provider, model_name=attempt_model, temperature=0.2)
            else:
                llm = get_llm(provider=attempt_provider, model_name=attempt_model, temperature=0.3)

            response = await llm.ainvoke(messages)
            summary_text = extract_text(response.content)
            break
        except Exception as e:
            last_error = e
            err_msg = str(e).lower()
            logger.error(f"[Summarizer] provider '{attempt_provider}' error: {e}")
            has_more = attempt_idx < len(fallback_providers) - 1

            if has_more:
                next_prov = fallback_providers[attempt_idx + 1]
                logger.warning(f"[Summarizer] failing over: {attempt_provider} -> {next_prov}")
                
                reason = "Error"
                if "quota" in err_msg or "429" in err_msg:
                    reason = "Quota exhausted"
                elif "503" in err_msg or "unavailable" in err_msg:
                    reason = "Service unavailable"
                    
                await adispatch_custom_event(
                    "provider_switch", 
                    {"from": attempt_provider, "to": next_prov, "reason": reason}
                )
                continue

            break

    if not summary_text and last_error is not None:
        err = str(last_error).lower()
        if "quota" in err or "429" in err:
            summary_text = "AI quota exhausted on all available providers. Please check your billing plans."
        elif "503" in err or "unavailable" in err:
            summary_text = "The AI provider is experiencing high demand. Please try again."
        else:
            summary_text = f"AI provider error: {str(last_error)[:100]}"

    logger.info(f"[Summarizer] Generated {len(summary_text)} chars")

    return {
        "summary": summary_text,
        "current_node": "summarizer",
    }
