"""
src/agents/langgraph/graphs/summary_graph.py
Summary workflow (Planner → Summarizer → Reporter) - skips deep retrieval
"""
from langgraph.graph import StateGraph, END
from src.agents.langgraph.state import AgentState
from src.agents.langgraph.nodes.planner_node import planner_node
from src.agents.langgraph.nodes.summarizer_node import summarizer_node
from src.agents.langgraph.nodes.report_node import report_node
from src.core.logger import get_logger

logger = get_logger(__name__)

def _should_continue(state: AgentState) -> str:
    if state.get("terminate"):
        return "end"
    return "summarizer"

def build_summary_graph() -> StateGraph:
    workflow = StateGraph(AgentState)

    workflow.add_node("planner", planner_node)
    workflow.add_node("summarizer", summarizer_node)
    workflow.add_node("reporter", report_node)

    workflow.set_entry_point("planner")
    
    workflow.add_conditional_edges(
        "planner",
        _should_continue,
        {
            "end": END,
            "summarizer": "summarizer",
        },
    )
    workflow.add_edge("summarizer", "reporter")
    workflow.add_edge("reporter", END)

    return workflow.compile()
