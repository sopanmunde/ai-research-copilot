"""
src/agents/langgraph/graphs/factory.py
Factory for loading the correct LangGraph workflow based on workflow_type.
"""
from langgraph.graph import StateGraph
from core.logger import get_logger

from .research_graph import build_research_graph
from .summary_graph import build_summary_graph
from .technical_graph import build_technical_graph
from .competitive_graph import build_competitive_graph
from .coding_graph import build_coding_graph
from .data_analysis_graph import build_data_analysis_graph

logger = get_logger(__name__)

_compiled_graphs = {}

BUILDERS = {
    "research":       build_research_graph,
    "summary":        build_summary_graph,
    "technical":      build_technical_graph,
    "competitive":    build_competitive_graph,
    "coding":         build_coding_graph,
    "data_analysis":  build_data_analysis_graph,
}


def get_workflow_for_mode(mode: str):
    """
    Returns the appropriate compiled LangGraph workflow.

    Args:
        mode: 'research' | 'summary' | 'technical' | 'competitive' | 'coding' | 'data_analysis'

    Returns:
        A compiled CompiledStateGraph instance.
    """
    if mode in _compiled_graphs:
        graph = _compiled_graphs[mode]
        if isinstance(graph, StateGraph):
            graph = graph.compile()
            _compiled_graphs[mode] = graph
        return graph

    logger.info(f"[Factory] Compiling workflow: {mode}")

    builder = BUILDERS.get(mode)
    if not builder:
        logger.warning(f"[Factory] Unknown mode '{mode}', falling back to research")
        builder = BUILDERS["research"]

    workflow = builder()
    if isinstance(workflow, StateGraph):
        workflow = workflow.compile()

    _compiled_graphs[mode] = workflow
    return workflow

