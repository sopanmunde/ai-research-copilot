from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_AUDIT_LOGS
from src.core.logger import get_logger

logger = get_logger(__name__)

def _db():
    return get_database()

def _serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc

async def insert_audit_log(log_data: dict) -> str:
    """
    Inserts a query audit log into MongoDB.
    """
    try:
        doc = {
            **log_data,
            "created_at": datetime.now(timezone.utc),
        }
        result = await _db()[COLLECTION_AUDIT_LOGS].insert_one(doc)
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Failed to write audit log to MongoDB: {e}")
        return ""

async def get_user_audit_logs(
    user_id: str, limit: int = 50, skip: int = 0, search: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieves audit logs for a specific user with pagination and optional search filter.
    """
    try:
        query: Dict[str, Any] = {"user_id": user_id}
        if search:
            query["$or"] = [
                {"query": {"$regex": search, "$options": "i"}},
                {"workflow_type": {"$regex": search, "$options": "i"}},
                {"mode": {"$regex": search, "$options": "i"}},
                {"provider": {"$regex": search, "$options": "i"}},
            ]
        cursor = (
            _db()[COLLECTION_AUDIT_LOGS]
            .find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        logs = await cursor.to_list(length=limit)
        return [_serialize_doc(log) for log in logs]
    except Exception as e:
        logger.error(f"Failed to retrieve user audit logs: {e}")
        return []

async def get_audit_log_by_id(log_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single audit log by ObjectId string for a user.
    """
    try:
        obj_id = ObjectId(log_id)
        doc = await _db()[COLLECTION_AUDIT_LOGS].find_one({"_id": obj_id, "user_id": user_id})
        return _serialize_doc(doc) if doc else None
    except (InvalidId, Exception) as e:
        logger.error(f"Failed to retrieve audit log {log_id}: {e}")
        return None

async def get_conversation_audit_logs(
    conversation_id: str, user_id: str
) -> List[Dict[str, Any]]:
    """
    Retrieves all audit logs for a specific conversation.
    """
    try:
        cursor = (
            _db()[COLLECTION_AUDIT_LOGS]
            .find({"conversation_id": conversation_id, "user_id": user_id})
            .sort("created_at", -1)
        )
        logs = await cursor.to_list(length=100)
        return [_serialize_doc(log) for log in logs]
    except Exception as e:
        logger.error(f"Failed to retrieve conversation audit logs: {e}")
        return []
