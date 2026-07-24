"""
src/agents/langgraph/nodes/code_review_node.py — Code Review Node
=================================================================
Reviews generated code for bugs, security issues, and best practices.
"""
from langchain_core.messages import SystemMessage, HumanMessage
from agents.langgraph.state import AgentState
from core.llm_factory import get_llm
from agents.langgraph.nodes.utils import extract_text
from core.logger import get_logger

logger = get_logger(__name__)

CODE_REVIEW_SYSTEM = """You are a Senior Code Reviewer. Review the following code for:

1. **Correctness**: Does it solve the problem correctly? Any logical errors?
2. **Security**: Any vulnerabilities (injection, XSS, auth issues, etc.)?
3. **Performance**: Any obvious performance bottlenecks?
4. **Best Practices**: Follows language/framework conventions?
5. **Edge Cases**: Handles empty inputs, errors, boundary conditions?

Provide a concise review with:
- Critical issues (must fix)
- Suggestions (nice to have)
- Overall assessment: ✅ Pass / ⚠️ Needs fixes / ❌ Reject

Be constructive and specific — reference line numbers where possible."""


async def code_review_node(state: AgentState) -> dict:
    """
    Code Review Node — reviews generated code.
    """
    generated_code = state.get("generated_code", "")
    query = state.get("query", "")
    provider = state.get("selected_llm_provider", "")
    model_name = state.get("selected_llm_model", "")

    if not generated_code:
        return {"code_review": "No code to review.", "current_node": "code_review"}

    logger.info(f"[CodeReview] provider={provider}, code={len(generated_code)} chars")

    llm = get_llm(
        provider=provider or "google",
        model_name=model_name or "gemini-2.5-flash",
        temperature=0.1,
    )

    messages = [
        SystemMessage(content=CODE_REVIEW_SYSTEM),
        HumanMessage(content=f"Original request: {query}\n\nCode to review:\n\n{generated_code}"),
    ]

    try:
        response = await llm.ainvoke(messages)
        code_review = extract_text(response.content)
    except Exception as e:
        logger.error(f"[CodeReview] LLM error: {e}")
        code_review = f"Review unavailable due to LLM error: {str(e)[:100]}"

    logger.info(f"[CodeReview] Generated {len(code_review)} chars")

    return {
        "code_review": code_review,
        "current_node": "code_review",
    }
