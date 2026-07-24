"""Task repository — CRUD operations for task boards stored in MongoDB."""
from datetime import datetime, timezone
from typing import List, Dict, Optional
from bson.objectid import ObjectId
from database.mongodb.connection import get_database
from core.constants import COLLECTION_TASKS
from core.logger import get_logger

logger = get_logger(__name__)


def _db():
    return get_database()


def clean_task(task: Dict) -> Dict:
    if not task:
        return task
    if "_id" in task:
        task["id"] = str(task.pop("_id"))
    if "created_at" in task and hasattr(task["created_at"], "isoformat"):
        task["created_at"] = task["created_at"].isoformat()
    return task


# High-quality seeding tasks (matches the frontend's mock tasks structure)
SEED_TASKS = [
    {
        "code": "TASK-8782",
        "type": "Documentation",
        "title": "You can't compress the program without quantifying the open-source SSD...",
        "description": "Set up security keys, endpoint redirects, and active token budgets inside the Brain Dashboard.",
        "status": "in-progress",
        "priority": "medium",
        "tags": ["LLM", "Backend"],
        "dueDate": "2026-07-05",
        "assignee": {"name": "Sopan Munde", "avatarInitials": "SM"},
        "progress": 60,
        "subtasks": [
            {"id": "sub-1-1", "title": "Retrieve API Keys from developer console", "completed": True},
            {"id": "sub-1-2", "title": "Add environment variable overrides", "completed": True},
            {"id": "sub-1-3", "title": "Test playground latency metrics", "completed": False},
        ],
        "history": [{"timestamp": "10:30 AM", "action": "Task initialized by AI autopilot"}]
    },
    {
        "code": "TASK-7878",
        "type": "Bug",
        "title": "Try to calculate the API connection, maybe it will override the cross-platform micro-service!",
        "description": "Examine CORS origin policies, cookie verification domains, and auth middleware interceptors.",
        "status": "todo",
        "priority": "high",
        "tags": ["Auth", "Security"],
        "dueDate": "2026-07-06",
        "assignee": {"name": "Aditya Bhayar", "avatarInitials": "AB"},
        "progress": 0,
        "subtasks": [
            {"id": "sub-2-1", "title": "Configure credential cookies support", "completed": False},
            {"id": "sub-2-2", "title": "Validate JWT claims parsing integrity", "completed": False}
        ],
        "history": []
    },
    {
        "code": "TASK-7839",
        "type": "Bug",
        "title": "We need to override the primary RSS firewall!",
        "description": "Investigate routing loop on cloud proxy rules and gateway configuration schemas.",
        "status": "todo",
        "priority": "high",
        "tags": ["Infrastructure", "Network"],
        "dueDate": "2026-07-10",
        "assignee": {"name": "Sopan Munde", "avatarInitials": "SM"},
        "progress": 0,
        "subtasks": [],
        "history": []
    },
    {
        "code": "TASK-1221",
        "type": "Feature",
        "title": "Implement multi-tenant RAG cache pipeline",
        "description": "Use isolated Redis cache keys prefixed by tenant and user ids.",
        "status": "done",
        "priority": "high",
        "tags": ["RAG", "Redis"],
        "dueDate": "2026-07-02",
        "assignee": {"name": "Sopan Munde", "avatarInitials": "SM"},
        "progress": 100,
        "subtasks": [
            {"id": "sub-4-1", "title": "Setup Redis connection settings", "completed": True},
            {"id": "sub-4-2", "title": "Deploy pipeline key middleware helpers", "completed": True}
        ],
        "history": [
            {"timestamp": "02:15 PM", "action": "Task marked done by Sopan Munde"}
        ]
    },
    {
        "code": "TASK-1182",
        "type": "Bug",
        "title": "Handle API gateway timeouts during large uploads...",
        "description": "Increase server ingress limits on route controllers.",
        "status": "backlog",
        "priority": "high",
        "tags": ["Backend", "Ingress"],
        "dueDate": "2026-07-30",
        "assignee": {"name": "Sopan Munde", "avatarInitials": "SM"},
        "progress": 0,
        "subtasks": [],
        "history": []
    }
]


async def get_user_tasks(user_id: str) -> List[Dict]:
    """Retrieves all tasks for the user. Seeds initial mock tasks if none exist."""
    count = await _db()[COLLECTION_TASKS].count_documents({"user_id": user_id})
    if count == 0:
        logger.info(f"Seeding {len(SEED_TASKS)} mock tasks for user {user_id}")
        seeded = []
        for index, t in enumerate(SEED_TASKS):
            task_copy = t.copy()
            task_copy["user_id"] = user_id
            task_copy["created_at"] = datetime.now(timezone.utc)
            seeded.append(task_copy)
        await _db()[COLLECTION_TASKS].insert_many(seeded)

    docs = await _db()[COLLECTION_TASKS].find({"user_id": user_id}).to_list(1000)
    return [clean_task(d) for d in docs]


async def create_task(user_id: str, task_data: Dict) -> Dict:
    """Creates a new task in the database."""
    payload = {
        "user_id": user_id,
        "code": task_data.get("code", "TASK-9999"),
        "type": task_data.get("type", "Feature"),
        "title": task_data.get("title", "Untitled Task"),
        "description": task_data.get("description", ""),
        "status": task_data.get("status", "todo"),
        "priority": task_data.get("priority", "medium"),
        "tags": task_data.get("tags", ["General"]),
        "dueDate": task_data.get("dueDate", ""),
        "assignee": task_data.get("assignee", {"name": "You", "avatarInitials": "Y"}),
        "progress": task_data.get("progress", 0),
        "subtasks": task_data.get("subtasks", []),
        "history": task_data.get("history", [{"timestamp": "Just now", "action": "Task created"}]),
        "created_at": datetime.now(timezone.utc)
    }
    result = await _db()[COLLECTION_TASKS].insert_one(payload)
    return clean_task(payload)


async def update_task_db(user_id: str, task_id: str, task_update: Dict) -> Optional[Dict]:
    """Updates an existing task in MongoDB."""
    try:
        # Prevent manual user_id or _id edits
        task_update.pop("id", None)
        task_update.pop("_id", None)
        task_update.pop("user_id", None)

        result = await _db()[COLLECTION_TASKS].find_one_and_update(
            {"_id": ObjectId(task_id), "user_id": user_id},
            {"$set": task_update},
            return_document=True
        )
        if result:
            return clean_task(result)
    except Exception as e:
        logger.error(f"Failed to update task {task_id}: {e}")
    return None


async def delete_task_metadata(user_id: str, task_id: str) -> bool:
    """Deletes a task from MongoDB."""
    try:
        result = await _db()[COLLECTION_TASKS].delete_one({
            "_id": ObjectId(task_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Failed to delete task {task_id}: {e}")
        return False
