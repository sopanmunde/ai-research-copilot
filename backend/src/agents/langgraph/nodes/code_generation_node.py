"""
src/agents/langgraph/nodes/code_generation_node.py — Code Generation Node
=========================================================================
Generates code based on the user's query and conversation history.
Uses the dynamically selected LLM.

Upgraded features:
  - Self-correction: If execution_errors is present in state (retry_count > 0),
    prepends the error and previous code to the prompt so the LLM can fix it.
  - Multi-file awareness: Annotates output format for multi-file scaffolding.
  - Tool binding: When CODING_TOOLS are available, uses llm.bind_tools() for
    function-calling capable models.
"""
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from agents.langgraph.state import AgentState
from core.llm_factory import get_llm
from agents.langgraph.nodes.utils import extract_text
from core.logger import get_logger

logger = get_logger(__name__)

CODE_GENERATION_SYSTEM = """You are an expert Senior Software Engineer. Your task is to generate
clean, well-documented, production-ready code based on the user's requirements.

RULES:
1. Write complete, working code — not snippets or pseudocode.
2. Include error handling and edge cases.
3. Use appropriate design patterns and best practices.
4. Explain the architecture/approach BEFORE showing code.
5. Output each file in a separate fenced code block with language annotation.
6. For multi-file projects, label each block with the target filename as a comment.
7. Consider performance, security, and maintainability.
8. Reference conversation history for context.

Output format for single file:
```python
# your code here
```

Output format for multi-file:
```python
# File: src/models/user.py
# ... code ...
```

```python
# File: src/routes/auth.py
# ... code ...
```"""

CODE_FIX_SYSTEM = """You are an expert Senior Software Engineer performing a code fix iteration.

The previous code you generated has FAILED with errors. Your job is to:
1. Analyze the error carefully
2. Identify the ROOT CAUSE of the failure
3. Generate a CORRECTED version of the code that fixes the issue

IMPORTANT:
- Do NOT repeat the same mistake
- Address all error messages shown
- If a module is missing, use only standard library alternatives
- Keep the core logic intact but fix the specific failing parts
- Output ONLY the corrected code in a fenced code block

Error Context will be provided in the next message."""


async def code_generation_node(state: AgentState) -> dict:
    """
    Code Generation Node — generates (or fixes) code for the given query.

    On first run (retry_count == 0): standard code generation.
    On retry (retry_count > 0): receives execution_errors and previous code,
    prompts the LLM to fix the specific failure.
    """
    query = state.get("query", "")
    history = state.get("history", [])
    provider = state.get("selected_llm_provider", "")
    model_name = state.get("selected_llm_model", "")
    retry_count = state.get("retry_count", 0)
    execution_errors = state.get("execution_errors", "")
    prev_code = state.get("generated_code", "")

    is_retry = retry_count > 0 and bool(execution_errors)

    logger.info(
        f"[CodeGen] provider={provider}, query='{query[:60]}', "
        f"retry={retry_count}, is_retry={is_retry}"
    )

    llm = get_llm(
        provider=provider or "google",
        model_name=model_name or "gemini-2.5-flash",
        temperature=0.15 if is_retry else 0.2,
    )

    if is_retry:
        # --- Self-correction mode ---
        logger.info(f"[CodeGen] 🔧 Self-correction mode (attempt {retry_count + 1})")
        messages = [
            SystemMessage(content=CODE_FIX_SYSTEM),
            HumanMessage(content=(
                f"Original request: {query}\n\n"
                f"--- Previous code that FAILED ---\n```\n{prev_code[:3000]}\n```\n\n"
                f"--- Execution Error ---\n{execution_errors[:1500]}\n\n"
                f"Please generate a FIXED version of the code that resolves these errors."
            )),
        ]
    else:
        # --- First generation ---
        messages: list[BaseMessage] = [SystemMessage(content=CODE_GENERATION_SYSTEM)]

        for turn in history[-4:]:
            role = turn.get("role", "")
            content = turn.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=query))

    try:
        response = await llm.ainvoke(messages)
        generated_code = extract_text(response.content)
    except Exception as e:
        logger.error(f"[CodeGen] LLM error: {e}")
        generated_code = f"# Error generating code: {str(e)[:100]}"

    logger.info(
        f"[CodeGen] Generated {len(generated_code)} chars "
        f"(retry_count={retry_count})"
    )

    return {
        "generated_code": generated_code,
        "current_node": "code_generation",
    }
