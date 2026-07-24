"""Research memory — saves complete research sessions to MongoDB."""
from datetime import datetime
from typing import List, Dict, Optional
from core.logger import get_logger

logger = get_logger(__name__)


async def save_research_session(
    reports_collection,
    user_id: str,
    conversation_id: str,
    query: str,
    plan: List[str],
    citations: List[Dict],
    summary: str,
    final_output: str,
) -> str:
    """
    Persist a full research session result (plan + citations + report).
    Returns the inserted document ID string.
    """
    doc = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "query": query,
        "plan": plan,
        "citations": citations,
        "summary": summary,
        "final_output": final_output,
        "created_at": datetime.utcnow(),
    }
    result = await reports_collection.insert_one(doc)
    logger.info(f"Saved research session {result.inserted_id} for user {user_id}")
    return str(result.inserted_id)


async def get_research_sessions(
    reports_collection,
    user_id: str,
    limit: int = 20,
) -> List[Dict]:
    """Retrieve recent research sessions for a user."""
    docs = await reports_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs
