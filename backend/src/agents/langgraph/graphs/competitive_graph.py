"""
src/agents/langgraph/graphs/competitive_graph.py
Competitive workflow for comparative analysis.
"""
from langgraph.graph import StateGraph, END
from src.agents.langgraph.state import AgentState
from src.agents.langgraph.nodes.planner_node import planner_node
from src.agents.langgraph.nodes.retriever_node import retriever_node
from src.agents.langgraph.nodes.citation_node import citation_node
from src.agents.langgraph.nodes.summarizer_node import summarizer_node
from src.agents.langgraph.nodes.report_node import report_node
from src.core.logger import get_logger

logger = get_logger(__name__)

def _should_retrieve(state: AgentState) -> str:
    if state.get("terminate"):
        return "end"
    plan = state.get("plan", [])
    return "retriever" if plan else "summarizer"

def build_competitive_graph() -> StateGraph:
    workflow = StateGraph(AgentState)

    workflow.add_node("planner", planner_node)
    workflow.add_node("retriever", retriever_node)
    workflow.add_node("citation", citation_node)
    workflow.add_node("summarizer", summarizer_node)
    workflow.add_node("reporter", report_node)

    workflow.set_entry_point("planner")

    workflow.add_conditional_edges(
        "planner",
        _should_retrieve,
        {
            "end": END,
            "retriever": "retriever",
            "summarizer": "summarizer",
        },
    )

    workflow.add_edge("retriever", "citation")
    workflow.add_edge("citation", "summarizer")
    workflow.add_edge("summarizer", "reporter")
    workflow.add_edge("reporter", END)

    return workflow.compile()