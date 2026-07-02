"""
src/agents/langgraph/nodes/report_node.py — Report Agent
========================================================
Assembles the final markdown response from summary + citations.
Adapts output format based on workflow_type.
"""
from src.agents.langgraph.state import AgentState
from src.core.logger import get_logger

logger = get_logger(__name__)


async def report_node(state: AgentState) -> dict:
    """
    Report Agent — assembles final output from the upstream node's result.
    Handles research, coding, and data_analysis workflow outputs.
    """
    summary = state.get("summary", "")
    citations = state.get("citations", [])
    report_mode = state.get("report_mode", False)
    workflow_type = state.get("workflow_type", "research")
    generated_code = state.get("generated_code", "")
    analysis_results = state.get("analysis_results", "")

    final_output = summary

    if workflow_type == "coding" and generated_code:
        code_review = state.get("code_review", "")
        test_results = state.get("test_results", "")
        final_output = summary
        if generated_code:
            final_output += f"\n\n```\n{generated_code}\n```\n"
        if code_review:
            final_output += f"\n\n**Code Review:**\n{code_review}\n"
        if test_results:
            final_output += f"\n\n**Test Results:**\n{test_results}\n"

    elif workflow_type == "data_analysis" and analysis_results:
        final_output = summary
        final_output += f"\n\n{analysis_results}\n"
        viz_data = state.get("visualization_data", {})
        if viz_data:
            final_output += f"\n\n**Visualization data available.**\n"

    elif citations:
        final_output += "\n\n---\n\n## 📚 References\n\n"
        for cit in citations:
            rank = cit.get("rank", cit.get("index", "•"))
            source = cit.get("filename", cit.get("source", "Unknown"))
            page = cit.get("page", "")
            confidence = cit.get("confidence", "")
            snippet = cit.get("snippet", "")
            uploaded_at = cit.get("uploaded_at", "")

            page_str = f" — Page {page}" if page and page not in ("N/A", "") else ""
            conf_str = f" _(confidence: {confidence})_" if confidence else ""
            date_str = f" · _{uploaded_at[:10]}_" if uploaded_at else ""

            final_output += f"{rank}. **{source}**{page_str}{conf_str}{date_str}\n"
            if snippet:
                final_output += f"   > {snippet}\n"
            final_output += "\n"

        if report_mode:
            final_output += (
                "\n---\n\n_This report was generated using semantic MMR retrieval "
                f"across {len(citations)} document source(s)._\n"
            )

    quality_score = {}
    if citations:
        coverage = min(100, len(citations) * 15 + 40)
        conf_scores = [c.get("confidence", 0.0) for c in citations if isinstance(c.get("confidence"), (float, int))]
        avg_conf = (sum(conf_scores) / len(conf_scores)) * 100 if conf_scores else 80
        confidence = min(100, max(0, avg_conf))
        completeness = min(100, max(40, len(summary) / 20))
        overall = (coverage + confidence + completeness) / 3
        quality_score = {
            "coverage": round(coverage),
            "confidence": round(confidence),
            "completeness": round(completeness),
            "overall": round(overall),
        }

    logger.info(
        f"[Report] workflow={workflow_type}, {len(final_output)} chars, "
        f"{len(citations)} citations"
    )

    return {
        "final_output": final_output,
        "quality_score": quality_score,
        "current_node": "reporter",
    }
