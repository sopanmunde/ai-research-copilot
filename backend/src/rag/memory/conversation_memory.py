"""MongoDB-backed conversation memory for persistent chat context."""
from typing import List, Dict
from datetime import datetime
from src.core.logger import get_logger

logger = get_logger(__name__)


async def get_conversation_history(
    messages_collection,
    conversation_id: str,
    limit: int = 10,
) -> List[Dict]:
    """
    Fetch the last N messages for a conversation from MongoDB.
    Returns list of {role, content} dicts.
    """
    try:
        docs = await messages_collection.find(
            {"conversation_id": conversation_id}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        docs = list(reversed(docs))
        return [{"role": d["role"], "content": d["content"]} for d in docs]
    except Exception as e:
        logger.warning(f"Could not load conversation history: {e}")
        return []


async def save_message(
    messages_collection,
    conversation_id: str,
    user_id: str,
    role: str,
    content: str,
    sources: List[Dict] = None,
) -> None:
    """Persist a single message to MongoDB."""
    await messages_collection.insert_one({
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "sources": sources or [],
        "created_at": datetime.utcnow(),
    })
