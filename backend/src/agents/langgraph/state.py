"""
src/agents/langgraph/state.py — Shared agent state definition
=============================================================
This TypedDict is passed through every node in the LangGraph workflow.

Agent pipeline (matches image workflow):
  Research Agent → Retrieval Agent → Citation Agent → Summary Agent → Report Agent
  (planner_node) → (retriever_node) → (citation_node) → (summarizer_node) → (report_node)
"""
from typing import TypedDict, List, Dict, Any, Annotated, Optional
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    """
    Shared state passed between all LangGraph nodes.
    All fields must have sensible defaults — nodes only update fields they own.
    """

    query: str
    conversation_id: Optional[str]
    user_id: Optional[str]
    filename: Optional[str]
    report_mode: bool
    mode: str
    workflow_type: str

    selected_llm_provider: str
    selected_llm_model: str
    requires_context: bool

    history: List[Dict[str, str]]
    messages: Annotated[List[BaseMessage], add_messages]

    plan: List[str]

    retrieved_docs: List[Dict[str, Any]]

    citations: List[Dict[str, Any]]

    summary: str

    generated_code: str
    code_review: str
    test_results: str

    analysis_results: str
    visualization_data: Dict[str, Any]

    final_output: str
    quality_score: Dict[str, Any]

    terminate: bool
    errors: List[str]
    current_node: str
