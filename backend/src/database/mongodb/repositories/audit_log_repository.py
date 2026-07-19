from datetime import datetime, timezone
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_AUDIT_LOGS
from src.core.logger import get_logger

logger = get_logger(__name__)

def _db():
    return get_database()

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
