"""
src/agents/langgraph/nodes/data_analysis_node.py — Data Analysis Node
=====================================================================
Analyzes data, generates insights, and produces visualization-ready output.
Uses the dynamically selected LLM.
"""
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from agents.langgraph.state import AgentState
from core.llm_factory import get_llm
from agents.langgraph.nodes.utils import extract_text
from core.logger import get_logger

logger = get_logger(__name__)

DATA_ANALYSIS_SYSTEM = """You are an expert Data Analyst and Data Scientist.

Your task is to analyze data, generate insights, and produce structured analysis.

RULES:
1. If the user describes a dataset, explain how you would analyze it.
2. Suggest specific analysis techniques (regression, clustering, etc.).
3. Provide code snippets for analysis when relevant.
4. Use markdown tables for presenting summary statistics.
5. Suggest appropriate visualizations (chart types, axes, etc.).
6. Explain your methodology and assumptions clearly.
7. Consider conversation history for context.

Output format:
## Analysis Approach
[your methodology]

## Key Insights
[your findings]

## Code / Implementation
[any relevant code]

## Visualization Suggestions
[chart recommendations]"""


async def data_analysis_node(state: AgentState) -> dict:
    """
    Data Analysis Node — performs data analysis based on the user's query.
    """
    query = state.get("query", "")
    history = state.get("history", [])
    provider = state.get("selected_llm_provider", "")
    model_name = state.get("selected_llm_model", "")

    logger.info(f"[DataAnalysis] provider={provider}, query='{query[:60]}'")

    llm = get_llm(
        provider=provider or "google",
        model_name=model_name or "gemini-2.5-flash",
        temperature=0.2,
    )

    messages: list[BaseMessage] = [SystemMessage(content=DATA_ANALYSIS_SYSTEM)]

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
        analysis_results = extract_text(response.content)
    except Exception as e:
        logger.error(f"[DataAnalysis] LLM error: {e}")
        analysis_results = f"Analysis unavailable due to LLM error: {str(e)[:100]}"

    logger.info(f"[DataAnalysis] Generated {len(analysis_results)} chars")

    return {
        "analysis_results": analysis_results,
        "current_node": "data_analysis",
    }
