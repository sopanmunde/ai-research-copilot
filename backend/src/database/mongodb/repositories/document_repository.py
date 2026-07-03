"""Document repository — stores metadata of indexed documents."""
from datetime import datetime, timezone
from typing import List, Dict, Optional
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_DOCUMENTS
from src.core.logger import get_logger

logger = get_logger(__name__)


def _db():
    return get_database()


async def save_document_metadata(
    user_id: str,
    filename: str,
    file_type: str,
    chunk_count: int,
    file_bytes: bytes = None,
    extra: Dict = None,
) -> str:
    from bson.binary import Binary
    payload = {
        "user_id": user_id,
        "filename": filename,
        "file_type": file_type,
        "chunk_count": chunk_count,
        "uploaded_at": datetime.now(timezone.utc),
    }
    if file_bytes is not None:
        payload["file_bytes"] = Binary(file_bytes)
    if extra:
        payload.update(extra)

    result = await _db()[COLLECTION_DOCUMENTS].insert_one(payload)
    logger.info(f"Saved document metadata: {filename} ({chunk_count} chunks)")
    return str(result.inserted_id)


async def get_user_documents(user_id: str, limit: int = 50) -> List[Dict]:
    docs = await _db()[COLLECTION_DOCUMENTS].find(
        {"user_id": user_id}
    ).sort("uploaded_at", -1).limit(limit).to_list(limit)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        if "uploaded_at" in d and hasattr(d["uploaded_at"], "isoformat"):
            d["uploaded_at"] = d["uploaded_at"].isoformat()
    return docs


async def delete_document_metadata(user_id: str, document_id: str) -> bool:
    from bson.objectid import ObjectId
    try:
        result = await _db()[COLLECTION_DOCUMENTS].delete_one({
            "_id": ObjectId(document_id),
            "user_id": user_id
        })
        logger.info(f"Deleted document {document_id} (deleted_count={result.deleted_count})")
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Failed to delete document {document_id}: {e}")
        return False
