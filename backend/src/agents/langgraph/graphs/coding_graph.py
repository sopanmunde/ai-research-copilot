"""
src/agents/langgraph/graphs/coding_graph.py
Coding/Development workflow — UPGRADED with execution & self-correction loop:

  planner → code_generation → execution → [conditional]
    ├── failed & retry < 3  → code_generation  (self-correction loop)
    └── passed or max retries → code_review → testing → reporter → END

Self-correction Loop:
  - execution_node runs generated code in a subprocess sandbox
  - if exit_code != 0 AND retry_count < MAX_RETRIES: route back to code_generation
  - code_generation receives execution_errors from state and fixes the code
  - Maximum 3 retries before proceeding to code_review regardless
"""
from langgraph.graph import StateGraph, END
from src.agents.langgraph.state import AgentState
from src.agents.langgraph.nodes.planner_node import planner_node
from src.agents.langgraph.nodes.code_generation_node import code_generation_node
from src.agents.langgraph.nodes.execution_node import execution_node
from src.agents.langgraph.nodes.code_review_node import code_review_node
from src.agents.langgraph.nodes.testing_node import testing_node
from src.agents.langgraph.nodes.report_node import report_node
from src.core.logger import get_logger

logger = get_logger(__name__)

MAX_RETRIES = 3


def _should_retry_or_proceed(state: AgentState) -> str:
    """
    Conditional routing after execution_node:
    - If execution failed AND retry_count < MAX_RETRIES → retry code generation
    - Otherwise → proceed to code_review
    """
    execution_errors = state.get("execution_errors", "")
    retry_count = state.get("retry_count", 0)

    if execution_errors and retry_count < MAX_RETRIES:
        logger.info(
            f"[CodingGraph] Execution failed (retry {retry_count}/{MAX_RETRIES}) — "
            f"routing back to code_generation for self-correction"
        )
        return "retry"
    else:
        if execution_errors:
            logger.info(
                f"[CodingGraph] Max retries reached ({MAX_RETRIES}) — "
                f"proceeding to code_review with best effort code"
            )
        else:
            logger.info("[CodingGraph] Execution passed — proceeding to code_review")
        return "proceed"


def build_coding_graph() -> StateGraph:
    """
    Assemble and compile the upgraded coding workflow graph.

    Graph topology:
      planner → code_generation → execution → [conditional]
        ├── retry  → code_generation  (self-correction, up to MAX_RETRIES)
        └── proceed → code_review → testing → reporter → END
    """
    workflow = StateGraph(AgentState)

    # Register nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("code_generation", code_generation_node)
    workflow.add_node("execution", execution_node)
    workflow.add_node("code_review", code_review_node)
    workflow.add_node("testing", testing_node)
    workflow.add_node("reporter", report_node)

    # Entry point
    workflow.set_entry_point("planner")

    # Linear edges
    workflow.add_edge("planner", "code_generation")
    workflow.add_edge("code_generation", "execution")

    # Self-correction conditional routing
    workflow.add_conditional_edges(
        "execution",
        _should_retry_or_proceed,
        {
            "retry": "code_generation",   # Loop back for self-correction
            "proceed": "code_review",     # Proceed to review pipeline
        },
    )

    # Review → testing → report pipeline
    workflow.add_edge("code_review", "testing")
    workflow.add_edge("testing", "reporter")
    workflow.add_edge("reporter", END)

    logger.info("[CodingGraph] Compiled: planner → code_gen → execution → [loop|review] → testing → reporter")
    return workflow.compile()
