"""
src/workflows/research_workflow.py — Extended workflow registry
================================================================
Provides workflow metadata, node descriptions, and configuration
for all supported workflow types for introspection and API docs.
"""
from typing import Dict, Any, List
from src.core.config import settings
from src.core.constants import DEFAULT_MODEL_MAP



WORKFLOW_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "research": {
        "label": "Deep Research",
        "description": "Full RAG pipeline: planner → retriever (Pinecone MMR) → citation → summarizer → reporter",
        "nodes": ["planner", "retriever", "citation", "summarizer", "reporter"],
        "default_model": settings.GEMINI_MODEL,
        "retrieval_required": True,
    },
    "summary": {
        "label": "Quick Summary",
        "description": "Condensed: planner → summarizer → reporter (skips retrieval)",
        "nodes": ["planner", "summarizer", "reporter"],
        "default_model": settings.GEMINI_MODEL,
        "retrieval_required": False,
    },
    "technical": {
        "label": "Technical Deep-Dive",
        "description": "Research with higher retrieval depth for technical topics",
        "nodes": ["planner", "retriever", "citation", "summarizer", "reporter"],
        "default_model": settings.GEMINI_MODEL,
        "retrieval_required": True,
    },
    "competitive": {
        "label": "Competitive Analysis",
        "description": "Multi-query comparison and analysis workflow",
        "nodes": ["planner", "retriever", "citation", "summarizer", "reporter"],
        "default_model": settings.GEMINI_MODEL,
        "retrieval_required": True,
    },
    "coding": {
        "label": "Code Generation & Review",
        "description": "Full dev workflow: code generation → review → testing → output",
        "nodes": ["planner", "code_generation", "code_review", "testing", "reporter"],
        "default_model": "gpt-4o-mini",
        "retrieval_required": False,
    },
    "data_analysis": {
        "label": "Data Analysis & Insights",
        "description": "Analyze data, generate insights, suggest visualizations",
        "nodes": ["planner", "data_analysis", "reporter"],
        "default_model": "gpt-4o-mini",
        "retrieval_required": False,
    },
}



WORKFLOW_NODES: List[Dict[str, Any]] = [
    {
        "id": "planner",
        "name": "Smart Router / Planner",
        "description": (
            "Analyzes the user query and decides if retrieval is needed. "
            "Routes to retriever for research workflows, to code_generation "
            "for coding, or to data_analysis for analysis workflows."
        ),
        "model": "dynamic (user-selected)",
        "output": ["plan", "requires_context", "current_node"],
        "routes_to": ["retriever", "summarizer", "code_generation", "data_analysis"],
        "routing": "conditional",
    },
    {
        "id": "retriever",
        "name": "Retrieval Agent (MMR)",
        "description": (
            "Executes planned search queries against Pinecone using "
            "MMR (Maximal Marginal Relevance) retrieval. Deduplicates results "
            "across queries using content-hash based doc_id."
        ),
        "model": "Pinecone MMR + dynamic embeddings",
        "output": ["retrieved_docs", "citations", "current_node"],
        "routes_to": ["citation"],
        "routing": "linear",
    },
    {
        "id": "citation",
        "name": "Citation Agent",
        "description": (
            "De-duplicates citations by doc_id hash. Applies confidence scoring "
            "based on retrieval rank (0.95 → 0.50 decaying). Ensures consistent "
            "citation structure for the frontend."
        ),
        "model": "deterministic",
        "output": ["citations", "current_node"],
        "routes_to": ["summarizer"],
        "routing": "linear",
    },
    {
        "id": "summarizer",
        "name": "Summarization Agent",
        "description": (
            "Synthesizes retrieved document chunks or LLM knowledge into a "
            "clear, cited markdown answer. Uses the dynamically selected LLM. "
            "Adapts system prompt based on workflow type."
        ),
        "model": "dynamic (user-selected)",
        "output": ["summary", "current_node"],
        "routes_to": ["reporter"],
        "routing": "linear",
    },
    {
        "id": "code_generation",
        "name": "Code Generation Agent",
        "description": (
            "Generates production-ready code based on user requirements. "
            "Includes error handling, edge cases, and documentation."
        ),
        "model": "dynamic (user-selected)",
        "output": ["generated_code", "current_node"],
        "routes_to": ["code_review"],
        "routing": "linear",
    },
    {
        "id": "code_review",
        "name": "Code Review Agent",
        "description": (
            "Reviews generated code for correctness, security, performance, "
            "and best practices. Provides structured feedback."
        ),
        "model": "dynamic (user-selected)",
        "output": ["code_review", "current_node"],
        "routes_to": ["testing"],
        "routing": "linear",
    },
    {
        "id": "testing",
        "name": "Testing Agent",
        "description": (
            "Generates unit tests covering happy path, edge cases, "
            "and error conditions for the generated code."
        ),
        "model": "dynamic (user-selected)",
        "output": ["test_results", "current_node"],
        "routes_to": ["reporter"],
        "routing": "linear",
    },
    {
        "id": "data_analysis",
        "name": "Data Analysis Agent",
        "description": (
            "Analyzes data, generates insights, suggests analysis techniques "
            "and visualizations based on the user's query."
        ),
        "model": "dynamic (user-selected)",
        "output": ["analysis_results", "current_node"],
        "routes_to": ["reporter"],
        "routing": "linear",
    },
    {
        "id": "reporter",
        "name": "Report Agent",
        "description": (
            "Assembles final output from upstream node results. Handles "
            "research citations, code blocks, and analysis results."
        ),
        "model": "deterministic",
        "output": ["final_output", "current_node"],
        "routes_to": ["END"],
        "routing": "linear",
    },
]



WORKFLOW_EDGES: List[Dict[str, Any]] = [
    {"from": "planner",    "to": "retriever",         "condition": "requires_context=True",  "workflows": ["research", "technical", "competitive"]},
    {"from": "planner",    "to": "summarizer",        "condition": "requires_context=False", "workflows": ["research", "technical", "competitive", "summary"]},
    {"from": "retriever",  "to": "citation",          "condition": None,                     "workflows": ["research", "technical", "competitive"]},
    {"from": "citation",   "to": "summarizer",        "condition": None,                     "workflows": ["research", "technical", "competitive"]},
    {"from": "summarizer", "to": "reporter",          "condition": None,                     "workflows": ["research", "technical", "competitive", "summary"]},
    {"from": "reporter",   "to": "END",               "condition": None,                     "workflows": "__all__"},
    {"from": "planner",            "to": "code_generation", "condition": None, "workflows": ["coding"]},
    {"from": "code_generation",    "to": "code_review",     "condition": None, "workflows": ["coding"]},
    {"from": "code_review",        "to": "testing",         "condition": None, "workflows": ["coding"]},
    {"from": "testing",            "to": "reporter",        "condition": None, "workflows": ["coding"]},
    {"from": "planner",       "to": "data_analysis", "condition": None, "workflows": ["data_analysis"]},
    {"from": "data_analysis", "to": "reporter",      "condition": None, "workflows": ["data_analysis"]},
]


def get_workflow_info(workflow_type: str = "research") -> Dict[str, Any]:
    """Get metadata for a specific workflow type."""
    definition = WORKFLOW_DEFINITIONS.get(workflow_type, WORKFLOW_DEFINITIONS["research"])
    nodes = [n for n in WORKFLOW_NODES if n["id"] in definition["nodes"]]
    edges = [e for e in WORKFLOW_EDGES if workflow_type in e.get("workflows", []) or "__all__" in e.get("workflows", [])]
    return {
        "type": workflow_type,
        "definition": definition,
        "nodes": nodes,
        "edges": edges,
    }


def get_node_names(workflow_type: str = "research") -> List[str]:
    """Get ordered node names for a workflow type."""
    definition = WORKFLOW_DEFINITIONS.get(workflow_type, WORKFLOW_DEFINITIONS["research"])
    return definition["nodes"]


def get_all_workflows() -> Dict[str, Dict[str, Any]]:
    """Get all available workflow types and their metadata."""
    return {
        wf_type: {
            "label": wf_def["label"],
            "description": wf_def["description"],
            "nodes": wf_def["nodes"],
            "retrieval_required": wf_def["retrieval_required"],
        }
        for wf_type, wf_def in WORKFLOW_DEFINITIONS.items()
    }
