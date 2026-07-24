"""
src/agents/langgraph/nodes/testing_node.py — Testing Node
=========================================================
Generates unit tests and test results for the generated code.
"""
from langchain_core.messages import SystemMessage, HumanMessage
from agents.langgraph.state import AgentState
from core.llm_factory import get_llm
from agents.langgraph.nodes.utils import extract_text
from core.logger import get_logger

logger = get_logger(__name__)

TESTING_SYSTEM = """You are a QA Engineer. Generate comprehensive unit tests for the provided code.

RULES:
1. Write tests covering: happy path, edge cases, error conditions.
2. Use the appropriate testing framework (pytest for Python, jest for JS, etc.).
3. Include test descriptions explaining what each test validates.
4. Consider mocks for external dependencies.
5. Output tests in a code block with language annotation."""


async def testing_node(state: AgentState) -> dict:
    """
    Testing Node — generates tests and expected results.
    """
    generated_code = state.get("generated_code", "")
    query = state.get("query", "")
    provider = state.get("selected_llm_provider", "")
    model_name = state.get("selected_llm_model", "")

    if not generated_code:
        return {"test_results": "No code to test.", "current_node": "testing"}

    logger.info(f"[Testing] provider={provider}, code={len(generated_code)} chars")

    llm = get_llm(
        provider=provider or "google",
        model_name=model_name or "gemini-2.5-flash",
        temperature=0.2,
    )

    messages = [
        SystemMessage(content=TESTING_SYSTEM),
        HumanMessage(content=f"Original request: {query}\n\nCode to test:\n\n{generated_code}"),
    ]

    try:
        response = await llm.ainvoke(messages)
        test_results = extract_text(response.content)
    except Exception as e:
        logger.error(f"[Testing] LLM error: {e}")
        test_results = f"Tests unavailable due to LLM error: {str(e)[:100]}"

    logger.info(f"[Testing] Generated {len(test_results)} chars")

    return {
        "test_results": test_results,
        "current_node": "testing",
    }
