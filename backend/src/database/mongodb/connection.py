"""MongoDB connection — Motor async client singleton."""
from functools import lru_cache
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from src.core.config import settings
from src.core.logger import get_logger

logger = get_logger(__name__)


import certifi

try:
    import dns.resolver
    custom_resolver = dns.resolver.Resolver()
    custom_resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
    dns.resolver.default_resolver = custom_resolver
    logger.info("Custom DNS resolver configured for MongoDB (Google/Cloudflare DNS)")
except Exception as e:
    logger.warning(f"Could not configure custom DNS resolver: {e}")


@lru_cache(maxsize=1)
def get_mongo_client() -> AsyncIOMotorClient:
    """
    Returns a cached Motor async client.

    Timeouts are kept short so Atlas latency does not block app startup.
    Motor is lazy — it does NOT physically connect until the first DB call.
    """
    uri = settings.MONGO_URI
    logger.info(f"Connecting to MongoDB: {uri[:40]}...")
    return AsyncIOMotorClient(
        uri,
        serverSelectionTimeoutMS=5000,   # fail fast if Atlas unreachable
        connectTimeoutMS=5000,
        socketTimeoutMS=10000,
        tlsCAFile=certifi.where(),
    )


def get_database() -> AsyncIOMotorDatabase:
    return get_mongo_client()[settings.MONGO_DB_NAME]


def get_collection(name: str):
    return get_database()[name]
