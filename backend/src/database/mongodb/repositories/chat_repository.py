"""Chat repository — messages and conversation persistence."""
from datetime import datetime
from typing import List, Dict, Optional
from bson import ObjectId
from bson.errors import InvalidId
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_MESSAGES, COLLECTION_CONVERSATIONS
from src.core.logger import get_logger

logger = get_logger(__name__)


def _db():
    return get_database()


async def insert_message(
    conversation_id: str,
    user_id: str,
    role: str,
    content: str,
    sources: List[Dict] = None,
    attached_file: Optional[Dict] = None,
    agent_steps: List[Dict] = None,
    source_heatmap: List[Dict] = None,
) -> str:
    doc = {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "sources": sources or [],
        "agent_steps": agent_steps or [],
        "source_heatmap": source_heatmap or [],
        "created_at": datetime.utcnow(),
    }
    if attached_file:
        doc["attachedFile"] = attached_file
    result = await _db()[COLLECTION_MESSAGES].insert_one(doc)
    return str(result.inserted_id)


async def get_messages(conversation_id: str, limit: int = 100) -> List[Dict]:
    docs = await _db()[COLLECTION_MESSAGES].find(
        {"conversation_id": conversation_id}
    ).sort("created_at", 1).limit(limit).to_list(limit)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


async def get_history(conversation_id: str, limit: int = 10) -> List[Dict]:
    """Returns last N messages as {role, content} for LLM context."""
    docs = await _db()[COLLECTION_MESSAGES].find(
        {"conversation_id": conversation_id}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return [{"role": d["role"], "content": d["content"]} for d in reversed(docs)]


async def touch_conversation(conversation_id: str) -> None:
    """Update the updated_at timestamp on a conversation."""
    try:
        await _db()[COLLECTION_CONVERSATIONS].update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"updated_at": datetime.utcnow()}},
        )
    except InvalidId:
        pass
