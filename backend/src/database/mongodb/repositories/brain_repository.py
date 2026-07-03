"""Brain repository — CRUD database helpers for providers, api keys, and playground messages in MongoDB."""
from datetime import datetime, timezone
from typing import List, Dict, Optional
from bson.objectid import ObjectId
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_PROVIDERS, COLLECTION_API_KEYS, COLLECTION_PLAYGROUND_MESSAGES
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


def get_seed_providers() -> List[Dict]:
    return [
        # Cloud Providers
        {
            "id": "openai", "name": "OpenAI", "type": "cloud", "logo": "OA",
            "description": "GPT-4o, o1 — leading reasoning models",
            "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-preview", "o1-mini"],
            "status": "connected", "isActive": True, "usageTokens": 2480000, "usageCost": 12.4, "latency": 280, "tokensPerSec": 85
        },
        {
            "id": "anthropic", "name": "Anthropic", "type": "cloud", "logo": "AN",
            "description": "Claude 3.5 Sonnet, Claude 3 Opus — safety-first AI",
            "models": ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
            "status": "disconnected", "isActive": False, "usageTokens": 0, "usageCost": 0.0, "latency": 0, "tokensPerSec": 0
        },
        {
            "id": "google", "name": "Google AI", "type": "cloud", "logo": "GG",
            "description": "Gemini 1.5 Pro, Gemini Flash — multimodal",
            "models": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
            "status": "disconnected", "isActive": False, "usageTokens": 0, "usageCost": 0.0, "latency": 0, "tokensPerSec": 0
        },
        {
            "id": "mistral", "name": "Mistral AI", "type": "cloud", "logo": "MI",
            "description": "Mistral Large, Codestral — European efficiency",
            "models": ["mistral-large-latest", "codestral-latest", "open-mistral-7b"],
            "status": "error", "isActive": False, "usageTokens": 120000, "usageCost": 0.18, "latency": 0, "tokensPerSec": 0
        },
        {
            "id": "groq", "name": "Groq", "type": "cloud", "logo": "GQ",
            "description": "Ultra-fast LPU inference — Llama, Mixtral",
            "models": ["llama-3.1-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"],
            "status": "disconnected", "isActive": False, "usageTokens": 0, "usageCost": 0.0, "latency": 0, "tokensPerSec": 0
        },
        {
            "id": "cohere", "name": "Cohere", "type": "cloud", "logo": "CO",
            "description": "Command R+ — enterprise RAG and search",
            "models": ["command-r-plus", "command-r", "command"],
            "status": "disconnected", "isActive": False, "usageTokens": 0, "usageCost": 0.0, "latency": 0, "tokensPerSec": 0
        },
        # Local Providers
        {
            "id": "ollama", "name": "Ollama", "type": "local", "logo": "OL",
            "description": "Run Llama, Mistral, Phi locally — zero cost",
            "models": ["llama3.2", "mistral", "phi3", "codellama"],
            "status": "disconnected", "isActive": False, "endpoint": "http://localhost:11434", "latency": 0, "tokensPerSec": 0
        },
        {
            "id": "lmstudio", "name": "LM Studio", "type": "local", "logo": "LM",
            "description": "GUI for local models — OpenAI-compatible API",
            "models": ["any-gguf-model"],
            "status": "disconnected", "isActive": False, "endpoint": "http://localhost:1234/v1", "latency": 0, "tokensPerSec": 0
        },
        {
            "id": "vllm", "name": "vLLM", "type": "local", "logo": "VL",
            "description": "High-throughput local serving — production ready",
            "models": ["any-huggingface-model"],
            "status": "disconnected", "isActive": False, "endpoint": "http://localhost:8000/v1", "latency": 0, "tokensPerSec": 0
        },
        {
            "id": "custom", "name": "Custom Endpoint", "type": "local", "logo": "CX",
            "description": "Any OpenAI-compatible REST API endpoint",
            "models": ["custom"],
            "status": "disconnected", "isActive": False, "endpoint": "https://your-api.example.com/v1", "latency": 0, "tokensPerSec": 0
        }
    ]


async def get_user_providers(user_id: str) -> List[Dict]:
    """Retrieves LLM providers configuration for the user. Seeds default configurations if empty."""
    count = await _db()[COLLECTION_PROVIDERS].count_documents({"user_id": user_id})
    if count == 0:
        logger.info(f"Seeding LLM providers configurations for user {user_id}")
        seeds = get_seed_providers()
        for s in seeds:
            s["user_id"] = user_id
            s["created_at"] = datetime.now(timezone.utc)
        await _db()[COLLECTION_PROVIDERS].insert_many(seeds)

    docs = await _db()[COLLECTION_PROVIDERS].find({"user_id": user_id}).to_list(100)
    return [clean_doc(d) for d in docs]


async def update_provider_db(user_id: str, provider_id: str, updates: Dict) -> Optional[Dict]:
    """Updates active state, endpoint, latency, throughput, status or stats for an LLM provider."""
    allowed_keys = ["isActive", "endpoint", "latency", "tokensPerSec", "status", "usageTokens", "usageCost"]
    update_payload = {k: v for k, v in updates.items() if k in allowed_keys}
    if not update_payload:
        return None

    # If setting isActive to True, optionally deactivate others in the same category/type?
    # Actually let the frontend dictate it, but let's update this record:
    result = await _db()[COLLECTION_PROVIDERS].find_one_and_update(
        {"user_id": user_id, "id": provider_id},
        {"$set": update_payload},
        return_document=True
    )
    return clean_doc(result)


async def get_user_keys(user_id: str) -> List[Dict]:
    """Retrieves all registered LLM API keys for the user. Seeds a default mock OpenAI key if empty."""
    count = await _db()[COLLECTION_API_KEYS].count_documents({"user_id": user_id})
    if count == 0:
        logger.info(f"Seeding mock OpenAI key for user {user_id}")
        seed_key = {
            "user_id": user_id,
            "providerId": "openai",
            "label": "Production Key",
            "key": "sk-proj-T8mVLxKqQ3wP9nBz4cRdGhYoEfJiNaDs7uCe2vXkAb1FmHrLyt",
            "createdAt": datetime.now(timezone.utc).strftime("%b %d, %Y"),
            "lastUsed": "2 mins ago",
            "isActive": True,
            "created_at": datetime.now(timezone.utc)
        }
        await _db()[COLLECTION_API_KEYS].insert_one(seed_key)

    docs = await _db()[COLLECTION_API_KEYS].find({"user_id": user_id}).to_list(100)
    return [clean_doc(d) for d in docs]


async def create_key_db(user_id: str, key_data: Dict) -> Dict:
    """Saves a new API key to MongoDB."""
    payload = {
        "user_id": user_id,
        "providerId": key_data.get("providerId", ""),
        "label": key_data.get("label", "Key Name"),
        "key": key_data.get("key", ""),
        "createdAt": datetime.now(timezone.utc).strftime("%b %d, %Y"),
        "lastUsed": "Never",
        "isActive": key_data.get("isActive", True),
        "created_at": datetime.now(timezone.utc)
    }
    result = await _db()[COLLECTION_API_KEYS].insert_one(payload)
    return clean_doc(payload)


async def update_key_db(user_id: str, key_id: str, updates: Dict) -> Optional[Dict]:
    """Updates a key's label, val, or active status."""
    allowed_keys = ["label", "key", "isActive", "lastUsed"]
    update_payload = {k: v for k, v in updates.items() if k in allowed_keys}
    if not update_payload:
        return None

    query = {"user_id": user_id}
    try:
        query["_id"] = ObjectId(key_id)
    except Exception:
        query["id"] = key_id

    result = await _db()[COLLECTION_API_KEYS].find_one_and_update(
        query,
        {"$set": update_payload},
        return_document=True
    )
    return clean_doc(result)


async def delete_key_db(user_id: str, key_id: str) -> bool:
    """Deletes an API key from MongoDB."""
    query = {"user_id": user_id}
    try:
        query["_id"] = ObjectId(key_id)
    except Exception:
        query["id"] = key_id

    result = await _db()[COLLECTION_API_KEYS].delete_one(query)
    return result.deleted_count > 0


async def get_playground_messages(user_id: str) -> List[Dict]:
    """Retrieves chat message history for the sandbox playground."""
    count = await _db()[COLLECTION_PLAYGROUND_MESSAGES].count_documents({"user_id": user_id})
    if count == 0:
        seed_msg = {
            "user_id": user_id,
            "role": "assistant",
            "content": "Playground ready. Choose a model, configure settings, and type a prompt below to see streaming outputs.",
            "timestamp": "Just now",
            "created_at": datetime.now(timezone.utc)
        }
        await _db()[COLLECTION_PLAYGROUND_MESSAGES].insert_one(seed_msg)

    docs = await _db()[COLLECTION_PLAYGROUND_MESSAGES].find({"user_id": user_id}).sort("created_at", 1).to_list(200)
    return [clean_doc(d) for d in docs]


async def create_playground_message_db(user_id: str, msg_data: Dict) -> Dict:
    """Saves a user or assistant message to chat sandbox history."""
    payload = {
        "user_id": user_id,
        "role": msg_data.get("role", "user"),
        "content": msg_data.get("content", ""),
        "timestamp": msg_data.get("timestamp", datetime.now(timezone.utc).strftime("%I:%M %p")),
        "modelUsed": msg_data.get("modelUsed"),
        "created_at": datetime.now(timezone.utc)
    }
    result = await _db()[COLLECTION_PLAYGROUND_MESSAGES].insert_one(payload)
    return clean_doc(payload)


async def clear_playground_messages_db(user_id: str) -> bool:
    """Clears all playground sandbox chat messages for the user."""
    result = await _db()[COLLECTION_PLAYGROUND_MESSAGES].delete_many({"user_id": user_id})
    return True
