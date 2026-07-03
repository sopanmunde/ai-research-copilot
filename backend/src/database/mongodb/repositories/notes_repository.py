"""Notes repository — CRUD database operations and seeding for notes in MongoDB."""
from datetime import datetime, timezone
from typing import List, Dict, Optional
from bson.objectid import ObjectId
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_NOTES
from src.core.logger import get_logger

logger = get_logger(__name__)


def _db():
    return get_database()


def clean_doc(doc: Dict) -> Dict:
    if not doc:
        return doc
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def get_seed_notes() -> List[Dict]:
    return [
        {
            "title": "System Architecture Overview",
            "content": "Our agentic pipeline relies on FastAPI routers directing queries to MongoDB. LangChain orchestrates research summaries. Frontend builds use Next.js with styled components.",
            "category": "work",
            "favorite": True,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Product Launch Roadmap",
            "content": "1. Run benchmark benchmarks.\n2. Enable Multi-LLM provider routes.\n3. Integrate Email & Tasks dashboards.\n4. Design premium notes tab.",
            "category": "work",
            "favorite": False,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Startup Pitch Ideas",
            "content": "Create a unified workplace workspace connecting email, tasks, calendar, documents, and notes via custom local LLM routers. Fast inference with local LM Studio.",
            "category": "ideas",
            "favorite": True,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        },
        {
            "title": "Grocery & Shopping List",
            "content": "Espresso roast beans, whole organic milk, Greek yogurt, organic strawberries, baby spinach, steel-cut oats.",
            "category": "personal",
            "favorite": False,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
    ]


async def get_user_notes(user_id: str) -> List[Dict]:
    """Retrieves all notes for the active user. Seeds default notes if empty."""
    count = await _db()[COLLECTION_NOTES].count_documents({"user_id": user_id})
    if count == 0:
        logger.info(f"Seeding default mock notes for user {user_id}")
        seeds = get_seed_notes()
        for s in seeds:
            s["user_id"] = user_id
            s["created_at"] = datetime.now(timezone.utc)
        await _db()[COLLECTION_NOTES].insert_many(seeds)

    docs = await _db()[COLLECTION_NOTES].find({"user_id": user_id}).sort("updatedAt", -1).to_list(200)
    return [clean_doc(d) for d in docs]


async def create_note_db(user_id: str, note_data: Dict) -> Dict:
    """Creates a new note for the user."""
    payload = {
        "user_id": user_id,
        "title": note_data.get("title", "Untitled Note").strip(),
        "content": note_data.get("content", "").strip(),
        "category": note_data.get("category", "general").strip(),
        "favorite": note_data.get("favorite", False),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc)
    }
    result = await _db()[COLLECTION_NOTES].insert_one(payload)
    return clean_doc(payload)


async def update_note_db(user_id: str, note_id: str, updates: Dict) -> Optional[Dict]:
    """Updates custom attributes of a user note."""
    allowed_keys = ["title", "content", "category", "favorite"]
    update_payload = {k: v for k, v in updates.items() if k in allowed_keys}
    if not update_payload:
        return None

    update_payload["updatedAt"] = datetime.now(timezone.utc).isoformat()

    query = {"user_id": user_id}
    try:
        query["_id"] = ObjectId(note_id)
    except Exception:
        query["id"] = note_id

    result = await _db()[COLLECTION_NOTES].find_one_and_update(
        query,
        {"$set": update_payload},
        return_document=True
    )
    return clean_doc(result)


async def delete_note_db(user_id: str, note_id: str) -> bool:
    """Deletes a note document from MongoDB."""
    query = {"user_id": user_id}
    try:
        query["_id"] = ObjectId(note_id)
    except Exception:
        query["id"] = note_id

    result = await _db()[COLLECTION_NOTES].delete_one(query)
    return result.deleted_count > 0
