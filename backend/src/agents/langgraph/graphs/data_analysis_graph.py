"""
src/agents/langgraph/graphs/data_analysis_graph.py
Data Analysis workflow:
  planner → data_analysis → reporter
"""
from langgraph.graph import StateGraph, END
from agents.langgraph.state import AgentState
from agents.langgraph.nodes.planner_node import planner_node
from agents.langgraph.nodes.data_analysis_node import data_analysis_node
from agents.langgraph.nodes.report_node import report_node
from core.logger import get_logger

logger = get_logger(__name__)


def build_data_analysis_graph() -> StateGraph:
    workflow = StateGraph(AgentState)

    workflow.add_node("planner", planner_node)
    workflow.add_node("data_analysis", data_analysis_node)
    workflow.add_node("reporter", report_node)

    workflow.set_entry_point("planner")

    workflow.add_edge("planner", "data_analysis")
    workflow.add_edge("data_analysis", "reporter")
    workflow.add_edge("reporter", END)

    return workflow.compile()
