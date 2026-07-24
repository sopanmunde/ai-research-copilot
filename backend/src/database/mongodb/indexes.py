"""MongoDB index definitions — separated from connection logic."""
from database.mongodb.connection import get_database
from core.constants import (
    COLLECTION_USERS, COLLECTION_CONVERSATIONS,
    COLLECTION_MESSAGES, COLLECTION_DOCUMENTS, COLLECTION_REPORTS,
)
from core.logger import get_logger

logger = get_logger(__name__)


async def create_indexes():
    """Create all necessary MongoDB indexes for optimal query performance."""
    db = get_database()
    try:
        await db[COLLECTION_USERS].create_index("email", unique=True)
        logger.info("Index: users.email (unique)")

        await db[COLLECTION_CONVERSATIONS].create_index("user_id")
        await db[COLLECTION_CONVERSATIONS].create_index("updated_at")
        logger.info("Index: conversations.user_id, updated_at")

        await db[COLLECTION_MESSAGES].create_index("conversation_id")
        await db[COLLECTION_MESSAGES].create_index("created_at")
        await db[COLLECTION_MESSAGES].create_index([("conversation_id", 1), ("created_at", 1)])
        logger.info("Index: messages.conversation_id, created_at (compound)")

        await db[COLLECTION_DOCUMENTS].create_index("user_id")
        await db[COLLECTION_DOCUMENTS].create_index("uploaded_at")
        logger.info("Index: documents.user_id, uploaded_at")

        await db[COLLECTION_REPORTS].create_index("user_id")
        await db[COLLECTION_REPORTS].create_index("conversation_id")
        await db[COLLECTION_REPORTS].create_index("created_at")
        logger.info("Index: reports.user_id, conversation_id, created_at")

    except Exception as e:
        logger.warning(f"Index creation warning (non-fatal): {e}")
