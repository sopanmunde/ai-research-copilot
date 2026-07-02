"""Report service — generates and persists research reports."""
from typing import Dict, Optional
from src.rag.pipelines.report_pipeline import generate_report
from src.rag.memory.research_memory import save_research_session
from src.core.llm_factory import get_llm
from src.core.logger import get_logger

logger = get_logger(__name__)


async def create_report(
    query: str,
    user_id: str,
    conversation_id: Optional[str],
    reports_collection,
    top_k: int = 10,
    model_provider: str = "",
    model_name: str = "",
) -> Dict:
    """
    Generates a research report and saves it to MongoDB.
    Returns the full report dict.
    """
    llm = get_llm(provider=model_provider, model_name=model_name)
    user_filter = {"user_id": user_id}

    result = await generate_report(
        query=query,
        llm=llm,
        top_k=top_k,
        user_filter=user_filter,
    )

    report_id = await save_research_session(
        reports_collection=reports_collection,
        user_id=user_id,
        conversation_id=conversation_id or "",
        query=query,
        plan=[],
        citations=result["citations"],
        summary=result["report"][:500],
        final_output=result["report"],
    )

    return {
        "report_id": report_id,
        "query": query,
        "report": result["report"],
        "citations": result["citations"],
    }
