"""User memory repository — stores user-specific key facts and research preferences."""
from datetime import datetime, timezone
from typing import List, Dict
from bson import ObjectId
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_USER_MEMORY
from src.core.logger import get_logger

logger = get_logger(__name__)


def _db():
    return get_database()


async def save_user_fact(user_id: str, fact: str) -> str:
    """
    Save or update a key fact about the user.
    Prevents duplicate facts by checking if the exact fact text already exists.
    """
    db = _db()
    
    # Check if this exact fact is already saved to prevent duplicates
    existing = await db[COLLECTION_USER_MEMORY].find_one({
        "user_id": user_id,
        "fact": fact
    })
    
    if existing:
        logger.debug(f"[User Memory] Fact already exists for user={user_id}")
        return str(existing["_id"])
        
    doc = {
        "user_id": user_id,
        "fact": fact,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    result = await db[COLLECTION_USER_MEMORY].insert_one(doc)
    logger.info(f"[User Memory] Saved new fact for user={user_id}: '{fact[:60]}...'")
    return str(result.inserted_id)


async def get_user_facts(user_id: str, limit: int = 15) -> List[Dict]:
    """Retrieve the latest N facts for a given user."""
    db = _db()
    docs = await db[COLLECTION_USER_MEMORY].find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for d in docs:
        d["id"] = str(d.pop("_id"))
        if "created_at" in d and hasattr(d["created_at"], "isoformat"):
            d["created_at"] = d["created_at"].isoformat()
        if "updated_at" in d and hasattr(d["updated_at"], "isoformat"):
            d["updated_at"] = d["updated_at"].isoformat()
            
    return docs


async def delete_user_fact(user_id: str, fact_id: str) -> bool:
    """Delete a specific user memory fact."""
    db = _db()
    try:
        result = await db[COLLECTION_USER_MEMORY].delete_one({
            "_id": ObjectId(fact_id),
            "user_id": user_id
        })
        logger.info(f"[User Memory] Deleted fact {fact_id} for user={user_id} (deleted_count={result.deleted_count})")
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"[User Memory] Failed to delete fact {fact_id}: {e}")
        return False
