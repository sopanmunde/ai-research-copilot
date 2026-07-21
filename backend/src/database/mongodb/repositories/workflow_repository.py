"""
src/database/mongodb/repositories/workflow_repository.py — Workflow CRUD & Log Repository
========================================================================================
Manages storage, updating, schedule state, and run logs for automated pipelines.
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_WORKFLOWS, COLLECTION_WORKFLOW_LOGS
from src.core.logger import get_logger

logger = get_logger(__name__)

def _db():
    return get_database()

def _serialize(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    for date_field in ["created_at", "updated_at", "last_run_at", "next_run_at"]:
        if isinstance(doc.get(date_field), datetime):
            doc[date_field] = doc[date_field].isoformat()
    return doc

async def create_workflow(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a new automation workflow definition.
    """
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "title": data.get("title", "Untitled Automation"),
        "description": data.get("description", ""),
        "trigger_type": data.get("trigger_type", "cron"),  # 'cron' | 'event' | 'webhook'
        "cron_expression": data.get("cron_expression", "0 8 * * 1"),  # e.g., Every Monday at 8 AM
        "event_type": data.get("event_type", "document_uploaded"),  # 'document_uploaded' | 'query_completed'
        "workflow_type": data.get("workflow_type", "research"),
        "query_prompt": data.get("query_prompt", "Summarize newly uploaded document and extract key entities."),
        "model_provider": data.get("model_provider", "google"),
        "nodes": data.get("nodes", []),
        "edges": data.get("edges", []),
        "is_active": data.get("is_active", True),
        "last_run_at": None,
        "next_run_at": None,
        "run_count": 0,
        "status": "idle",
        "created_at": now,
        "updated_at": now,
    }
    res = await _db()[COLLECTION_WORKFLOWS].insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)

async def get_user_workflows(user_id: str) -> List[Dict[str, Any]]:
    """
    Returns all workflow automations for a given user.
    """
    cursor = _db()[COLLECTION_WORKFLOWS].find({"user_id": user_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=200)
    return [_serialize(d) for d in docs]

async def get_workflow_by_id(workflow_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Fetches a single workflow by ID.
    """
    try:
        obj_id = ObjectId(workflow_id)
        query: Dict[str, Any] = {"_id": obj_id}
        if user_id:
            query["user_id"] = user_id
        doc = await _db()[COLLECTION_WORKFLOWS].find_one(query)
        return _serialize(doc)
    except (InvalidId, Exception) as e:
        logger.error(f"Error fetching workflow {workflow_id}: {e}")
        return None

async def update_workflow_db(workflow_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Updates workflow properties.
    """
    try:
        obj_id = ObjectId(workflow_id)
        clean_updates = {k: v for k, v in updates.items() if k not in ["_id", "id", "user_id"]}
        clean_updates["updated_at"] = datetime.now(timezone.utc)

        res = await _db()[COLLECTION_WORKFLOWS].find_one_and_update(
            {"_id": obj_id, "user_id": user_id},
            {"$set": clean_updates},
            return_document=True,
        )
        return _serialize(res)
    except Exception as e:
        logger.error(f"Failed to update workflow {workflow_id}: {e}")
        return None

async def delete_workflow_db(workflow_id: str, user_id: str) -> bool:
    """
    Deletes a workflow definition.
    """
    try:
        obj_id = ObjectId(workflow_id)
        res = await _db()[COLLECTION_WORKFLOWS].delete_one({"_id": obj_id, "user_id": user_id})
        return res.deleted_count > 0
    except Exception as e:
        logger.error(f"Failed to delete workflow {workflow_id}: {e}")
        return False

async def get_active_scheduled_workflows() -> List[Dict[str, Any]]:
    """
    Retrieves all active scheduled (cron) workflows across all users for the scheduler engine.
    """
    cursor = _db()[COLLECTION_WORKFLOWS].find({"is_active": True, "trigger_type": "cron"})
    docs = await cursor.to_list(length=1000)
    return [_serialize(d) for d in docs]

async def get_active_event_workflows(event_type: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieves all active event-triggered workflows matching an event type.
    """
    query: Dict[str, Any] = {
        "is_active": True,
        "trigger_type": "event",
        "event_type": event_type,
    }
    if user_id:
        query["user_id"] = user_id
    cursor = _db()[COLLECTION_WORKFLOWS].find(query)
    docs = await cursor.to_list(length=500)
    return [_serialize(d) for d in docs]

async def record_workflow_log(log_data: Dict[str, Any]) -> str:
    """
    Writes a workflow run execution log to MongoDB.
    """
    try:
        doc = {
            **log_data,
            "created_at": datetime.now(timezone.utc),
        }
        res = await _db()[COLLECTION_WORKFLOW_LOGS].insert_one(doc)
        
        # Touch parent workflow last_run_at and run_count
        if "workflow_id" in log_data:
            try:
                obj_id = ObjectId(log_data["workflow_id"])
                await _db()[COLLECTION_WORKFLOWS].update_one(
                    {"_id": obj_id},
                    {
                        "$set": {"last_run_at": datetime.now(timezone.utc), "status": log_data.get("status", "completed")},
                        "$inc": {"run_count": 1},
                    },
                )
            except Exception:
                pass
                
        return str(res.inserted_id)
    except Exception as e:
        logger.error(f"Failed to write workflow log: {e}")
        return ""

async def get_workflow_logs_db(workflow_id: str, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Retrieves history logs for a specific workflow automation.
    """
    try:
        cursor = (
            _db()[COLLECTION_WORKFLOW_LOGS]
            .find({"workflow_id": workflow_id, "user_id": user_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)
        return [_serialize(d) for d in docs]
    except Exception as e:
        logger.error(f"Failed to fetch workflow logs: {e}")
        return []
