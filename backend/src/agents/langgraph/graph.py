"""
src/agents/langgraph/graph.py — LangGraph multi-agent workflow coordinator
==========================================================================
Coordinates the 5-agent research pipeline matching the image workflow:

  Research Agent → [conditional] → Retrieval Agent → Citation Agent
                                 → Summary Agent  → Report Agent → END
               ↘ (no retrieval) → Summary Agent  → ...

Also loads coding and data_analysis workflows when requested.

Agent mapping (image label → node name):
  Research agent  → planner_node   (query analysis + smart routing)
  Retrieval agent → retriever_node (MMR semantic search via Pinecone)
  Citation agent  → citation_node  (dedup + confidence scoring)
  Summary agent   → summarizer_node (LLM synthesis with history)
  Report agent    → report_node    (final markdown assembly)
"""
from langgraph.graph import StateGraph, END
from src.agents.langgraph.state import AgentState
from src.agents.langgraph.nodes.planner_node import planner_node
from src.agents.langgraph.nodes.voice_preprocessing_node import voice_preprocessing_node
from src.agents.langgraph.nodes.retriever_node import retriever_node
from src.agents.langgraph.nodes.web_research_node import web_research_node
from src.agents.langgraph.nodes.summarizer_node import summarizer_node
from src.agents.langgraph.nodes.citation_node import citation_node
from src.agents.langgraph.nodes.report_node import report_node
from src.agents.langgraph.nodes.vision_extraction_node import vision_extraction_node
from src.agents.langgraph.nodes.memory_retrieval_node import memory_retrieval_node
from src.agents.langgraph.nodes.code_generation_node import code_generation_node
from src.agents.langgraph.nodes.code_review_node import code_review_node
from src.agents.langgraph.nodes.testing_node import testing_node
from src.agents.langgraph.nodes.data_analysis_node import data_analysis_node
from src.agents.langgraph.graphs.factory import get_workflow_for_mode
from src.core.logger import get_logger

logger = get_logger(__name__)

_compiled_graph = None


def _should_retrieve(state: AgentState) -> str:
    """
    Conditional routing: if requires_context, run retrieval.
    Otherwise skip to summarizer directly.
    """
    if state.get("terminate"):
        return "end"
        
    filename = state.get("filename", "") or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    IMAGE_EXTS = {"png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "svg"}
    
    # If the active file is an image, route to the vision extractor node first
    if ext in IMAGE_EXTS:
        logger.debug(f"[Graph] Routing after planner/memory_retriever → vision_extractor")
        return "vision_extractor"
        
    requires_context = state.get("requires_context", False)
    route = "retriever" if requires_context else "summarizer"
    logger.debug(f"[Graph] Routing after planner/memory_retriever → {route}")
    return route


def build_graph() -> StateGraph:
    """
    Assemble and compile the LangGraph multi-agent research workflow.

    Graph topology:
      planner → memory_retriever → [conditional: retriever | vision_extractor | summarizer]
      vision_extractor → summarizer
      retriever → citation → summarizer → reporter → END
      summarizer → reporter → END  (when retrieval skipped)
    """
    workflow = StateGraph(AgentState)

    workflow.add_node("voice_preprocessor", voice_preprocessing_node)
    workflow.add_node("planner", planner_node)
    workflow.add_node("memory_retriever", memory_retrieval_node)
    workflow.add_node("vision_extractor", vision_extraction_node)
    workflow.add_node("retriever", retriever_node)
    workflow.add_node("web_researcher", web_research_node)
    workflow.add_node("citation", citation_node)
    workflow.add_node("summarizer", summarizer_node)
    workflow.add_node("reporter", report_node)

    workflow.set_entry_point("voice_preprocessor")

    workflow.add_edge("voice_preprocessor", "planner")
    workflow.add_edge("planner", "memory_retriever")

    workflow.add_conditional_edges(
        "memory_retriever",
        _should_retrieve,
        {
            "end": END,
            "retriever": "retriever",
            "vision_extractor": "vision_extractor",
            "summarizer": "summarizer",
        },
    )

    workflow.add_edge("vision_extractor", "summarizer")
    workflow.add_edge("retriever", "web_researcher")
    workflow.add_edge("web_researcher", "citation")
    workflow.add_edge("citation", "summarizer")
    workflow.add_edge("summarizer", "reporter")
    workflow.add_edge("reporter", END)

    compiled = workflow.compile()
    logger.info("[Graph] Research workflow compiled successfully")
    return compiled


def get_graph(workflow_type: str = "research"):
    """
    Returns the compiled LangGraph for the given workflow type.

    Args:
        workflow_type: 'research' | 'summary' | 'technical' | 'competitive' |
                      'coding' | 'data_analysis'

    For the standard research pipeline, uses a cached global instance.
    For other workflows, delegates to the factory.
    """
    if workflow_type == "research":
        global _compiled_graph
        if _compiled_graph is None:
            _compiled_graph = build_graph()
        return _compiled_graph

    return get_workflow_for_mode(workflow_type)


def reset_graph():
    """Force rebuild on next get_graph() call. Useful for testing."""
    global _compiled_graph
    _compiled_graph = None
