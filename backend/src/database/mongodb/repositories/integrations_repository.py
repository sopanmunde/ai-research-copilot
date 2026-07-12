"""Integrations repository — user integration configurations and plugins."""
from datetime import datetime
from typing import Dict, Any
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_INTEGRATIONS
from src.core.logger import get_logger

logger = get_logger(__name__)


def _db():
    return get_database()


def get_default_integrations(user_id: str) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "apps": {
            "tasks": {"enabled": True, "autoSync": True, "defaultList": "Inbox"},
            "calendar": {"enabled": True, "syncInterval": 30, "activeCalendars": ["Personal", "Work"]},
            "email": {"enabled": True, "autoDraft": False, "syncLabels": ["Inbox", "Sent"]},
            "gallery": {"enabled": True, "syncFolders": ["Documents", "Images"], "maxFileSize": 5},
            "notes": {"enabled": True, "notionSync": False, "keepSync": True}
        },
        "skills": [
            {
                "id": "skill-1",
                "name": "Web Scraper",
                "description": "Extract structured data from website URLs",
                "systemPrompt": "You are a web scraping assistant. Given a URL, extract content cleanly.",
                "isActive": True
            },
            {
                "id": "skill-2",
                "name": "Code Executor",
                "description": "Run and test Python sandbox code snippets",
                "systemPrompt": "You are a sandbox python execution shell. Format code block outputs clearly.",
                "isActive": False
            }
        ],
        "mcp_plugins": [
            {
                "id": "mcp-1",
                "name": "SQLite Server",
                "endpoint": "http://localhost:8081/mcp/sqlite",
                "status": "connected",
                "token": "sq-default-token-xyz123"
            },
            {
                "id": "mcp-2",
                "name": "Filesystem Tool",
                "endpoint": "http://localhost:8082/mcp/fs",
                "status": "disconnected",
                "token": ""
            }
        ],
        "lsp": {
            "enabled": True,
            "servers": [
                {"language": "python", "command": "pyright-langserver --stdio", "port": 50051, "active": True},
                {"language": "typescript", "command": "typescript-language-server --stdio", "port": 50052, "active": False}
            ]
        },
        "acp": {
            "enabled": True,
            "triggerDelay": 150,
            "contextLength": 4096,
            "ghostTextStyle": "italic-zinc"
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


async def get_integrations(user_id: str) -> Dict[str, Any]:
    doc = await _db()[COLLECTION_INTEGRATIONS].find_one({"user_id": user_id})
    if not doc:
        doc = get_default_integrations(user_id)
        await _db()[COLLECTION_INTEGRATIONS].insert_one(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


async def update_integrations(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    update_data = {k: v for k, v in data.items() if k not in ["_id", "id", "user_id", "created_at"]}
    update_data["updated_at"] = datetime.utcnow()
    
    await _db()[COLLECTION_INTEGRATIONS].update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )
    
    return await get_integrations(user_id)
