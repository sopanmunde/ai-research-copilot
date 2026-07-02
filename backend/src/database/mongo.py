"""
src/database/mongo.py — Backward-compatible shim
=================================================
Exposes the same collection names that old modules (conversations.py, etc.)
import, but delegates to the new Motor connection from connection.py.
This eliminates the dual-client problem.
"""
from src.database.mongodb.connection import get_database
from src.core.constants import (
    COLLECTION_USERS,
    COLLECTION_CONVERSATIONS,
    COLLECTION_MESSAGES,
    COLLECTION_DOCUMENTS,
    COLLECTION_REPORTS,
)


def _db():
    return get_database()


class _LazyCollection:
    """Proxy that forwards all attribute/method access to the real Motor collection."""
    def __init__(self, name: str):
        self._name = name

    def __getattr__(self, item):
        return getattr(_db()[self._name], item)

    def __call__(self, *args, **kwargs):
        return _db()[self._name](*args, **kwargs)


users_collection       = _LazyCollection(COLLECTION_USERS)
conversations_collection = _LazyCollection(COLLECTION_CONVERSATIONS)
messages_collection    = _LazyCollection(COLLECTION_MESSAGES)
documents_collection   = _LazyCollection(COLLECTION_DOCUMENTS)
reports_collection     = _LazyCollection(COLLECTION_REPORTS)


async def init_db_indexes():
    """Delegates to the new indexes module."""
    from src.database.mongodb.indexes import create_indexes
    await create_indexes()
