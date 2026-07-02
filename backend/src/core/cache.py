"""
src/core/cache.py — Optional Redis cache layer
===============================================
Provides a thin async cache wrapper for RAG query results.
If Redis is unavailable or REDIS_URL is empty, all operations
are silent no-ops — the pipeline continues without caching.

Usage:
    from src.core.cache import cache_get, cache_set

    hit = await cache_get(key)
    if hit:
        return hit
    result = await expensive_operation()
    await cache_set(key, result, ttl=3600)
"""
import json
import hashlib
from typing import Any, Optional
from src.core.logger import get_logger

logger = get_logger(__name__)

_redis_client = None


async def _get_client():
    """Return cached Redis client or None if Redis is disabled/unavailable."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    from src.core.config import settings
    if not settings.REDIS_URL:
        return None

    try:
        import redis.asyncio as aioredis  # type: ignore
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=2,
        )
        await _redis_client.ping()
        logger.info(f"Redis cache connected: {settings.REDIS_URL}")
        return _redis_client
    except Exception as e:
        logger.warning(f"Redis unavailable — caching disabled: {e}")
        _redis_client = None  # keep None so we don't retry on every call
        return None


def make_cache_key(prefix: str, *parts: str) -> str:
    """
    Build a deterministic cache key from a prefix and variable parts.
    SHA-256 hashes the joined parts so keys stay short.
    """
    raw = "|".join(str(p) for p in parts)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"{prefix}{digest}"


async def cache_get(key: str) -> Optional[Any]:
    """
    Retrieve a cached value by key.
    Returns the deserialized Python object, or None on miss/error.
    """
    client = await _get_client()
    if client is None:
        return None
    try:
        raw = await client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as e:
        logger.debug(f"Cache GET error for '{key}': {e}")
        return None


async def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    """
    Store a value in cache with a TTL (seconds).
    Returns True on success, False on error/disabled.
    """
    client = await _get_client()
    if client is None:
        return False
    try:
        await client.setex(key, ttl, json.dumps(value, default=str))
        return True
    except Exception as e:
        logger.debug(f"Cache SET error for '{key}': {e}")
        return False


async def cache_delete(key: str) -> bool:
    """Invalidate a single cache entry."""
    client = await _get_client()
    if client is None:
        return False
    try:
        await client.delete(key)
        return True
    except Exception as e:
        logger.debug(f"Cache DELETE error for '{key}': {e}")
        return False
