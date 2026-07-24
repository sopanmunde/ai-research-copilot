"""
src/api/routes/health_routes.py — Enhanced health check with dependency status
===============================================================================
GET /api/health/  — returns service health, version, and status of all
                    external dependencies (MongoDB, Pinecone, LangGraph).
"""
import time
from fastapi import APIRouter
from core.config import settings
from core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


async def _check_mongodb() -> dict:
    """Ping MongoDB and return latency."""
    start = time.monotonic()
    try:
        from database.mongodb.connection import get_database
        db = get_database()
        await db.command("ping")
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        return {"status": "healthy", "latency_ms": latency_ms}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:120]}


def _check_pinecone() -> dict:
    """Verify Pinecone vector store is initialized."""
    start = time.monotonic()
    try:
        from rag.vectorstores.pinecone_store import get_vector_store
        store = get_vector_store()
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        index_name = getattr(store, "_index_name", settings.PINECONE_INDEX_NAME)
        return {
            "status": "healthy",
            "index": index_name,
            "latency_ms": latency_ms,
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:120]}


def _check_langgraph() -> dict:
    """Verify LangGraph workflow is compiled and ready."""
    start = time.monotonic()
    try:
        from agents.langgraph.graph import get_graph
        graph = get_graph()
        latency_ms = round((time.monotonic() - start) * 1000, 1)
        compiled = graph is not None
        return {
            "status": "healthy" if compiled else "unhealthy",
            "nodes": ["planner", "retriever", "citation", "summarizer", "reporter"],
            "latency_ms": latency_ms,
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:120]}


async def _check_redis() -> dict:
    """Check Redis cache availability (non-fatal)."""
    if not settings.REDIS_URL:
        return {"status": "disabled", "note": "REDIS_URL not configured"}
    start = time.monotonic()
    try:
        from core.cache import _get_client
        client = await _get_client()
        if client:
            await client.ping()
            latency_ms = round((time.monotonic() - start) * 1000, 1)
            return {"status": "healthy", "latency_ms": latency_ms}
        return {"status": "disabled"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)[:80]}


@router.get("/", summary="Comprehensive health check with dependency status")
async def health():
    """
    GET /api/health/

    Returns overall system health and individual dependency status:
    - MongoDB connectivity + ping latency
    - Pinecone vector store initialization
    - LangGraph workflow compilation
    - Redis cache (if configured)
    """
    start = time.monotonic()

    mongodb   = await _check_mongodb()
    pinecone  = _check_pinecone()
    langgraph = _check_langgraph()
    redis     = await _check_redis()

    total_ms = round((time.monotonic() - start) * 1000, 1)

    all_healthy = all(
        d["status"] == "healthy"
        for d in [mongodb, pinecone, langgraph]
    )

    return {
        "status": "healthy" if all_healthy else "degraded",
        "version": settings.VERSION,
        "project": settings.PROJECT_NAME,
        "total_check_ms": total_ms,
        "dependencies": {
            "mongodb": mongodb,
            "pinecone": pinecone,
            "langgraph": langgraph,
            "redis": redis,
        },
    }
