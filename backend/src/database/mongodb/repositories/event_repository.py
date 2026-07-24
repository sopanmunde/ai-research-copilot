"""Event repository — CRUD database helpers for calendar events in MongoDB."""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from bson.objectid import ObjectId
from database.mongodb.connection import get_database
from core.constants import COLLECTION_EVENTS
from core.logger import get_logger

logger = get_logger(__name__)


def _db():
    return get_database()


def clean_event(event: Dict) -> Dict:
    if not event:
        return event
    if "_id" in event:
        event["id"] = str(event.pop("_id"))
    return event


def get_seed_events() -> List[Dict]:
    now = datetime.now(timezone.utc)
    return [
        {
            "title": "AI Agent Architecture Sync",
            "from": (now.replace(hour=9, minute=0, second=0, microsecond=0)).isoformat(),
            "to": (now.replace(hour=10, minute=0, second=0, microsecond=0)).isoformat(),
            "type": "blue",
            "description": "Discuss Gemini integration plans and local provider endpoints.",
            "location": "Conference Room Alpha"
        },
        {
            "title": "Design Review: Dashboard Mockups",
            "from": (now.replace(hour=11, minute=30, second=0, microsecond=0)).isoformat(),
            "to": (now.replace(hour=12, minute=30, second=0, microsecond=0)).isoformat(),
            "type": "purple",
            "description": "Go over frontend layout adjustments and dark mode settings.",
            "location": "Huddle Room B"
        },
        {
            "title": "Client Demo: TriVisionX Alpha v1",
            "from": (now.replace(hour=14, minute=0, second=0, microsecond=0)).isoformat(),
            "to": (now.replace(hour=15, minute=0, second=0, microsecond=0)).isoformat(),
            "type": "green",
            "description": "Live demonstration of automated pipeline execution.",
            "location": "Virtual Meet Link"
        },
        {
            "title": "Product Launch Planning",
            "from": (now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat(),
            "to": (now + timedelta(days=1)).replace(hour=11, minute=30, second=0, microsecond=0).isoformat(),
            "type": "orange",
            "description": "Strategic planning session for marketing and developer outreach.",
            "location": "Executive Boardroom"
        }
    ]


async def get_user_events(user_id: str) -> List[Dict]:
    """Retrieves all calendar events for the user. Seeds initial events if empty."""
    count = await _db()[COLLECTION_EVENTS].count_documents({"user_id": user_id})
    if count == 0:
        logger.info(f"Seeding mock calendar events for user {user_id}")
        seeds = get_seed_events()
        for s in seeds:
            s["user_id"] = user_id
            s["created_at"] = datetime.now(timezone.utc)
        await _db()[COLLECTION_EVENTS].insert_many(seeds)

    docs = await _db()[COLLECTION_EVENTS].find({"user_id": user_id}).to_list(1000)
    return [clean_event(d) for d in docs]


async def create_event(user_id: str, event_data: Dict) -> Dict:
    """Creates a new calendar event in MongoDB."""
    default_notifs = ["2d", "1d", "5h", "1h", "30m", "5m", "start"]
    payload = {
        "user_id": user_id,
        "title": event_data.get("title", "New Event"),
        "from": event_data.get("from", ""),
        "to": event_data.get("to", ""),
        "type": event_data.get("type", "blue"),
        "description": event_data.get("description", ""),
        "location": event_data.get("location", ""),
        "allDay": event_data.get("allDay", False),
        "emailNotifications": event_data.get("emailNotifications", default_notifs),
        "notificationEmail": event_data.get("notificationEmail", ""),
        "sentNotifications": [],
        "created_at": datetime.now(timezone.utc)
    }
    result = await _db()[COLLECTION_EVENTS].insert_one(payload)
    return clean_event(payload)


async def delete_event_metadata(user_id: str, event_id: str) -> bool:
    """Deletes an event from MongoDB."""
    try:
        result = await _db()[COLLECTION_EVENTS].delete_one({
            "_id": ObjectId(event_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Failed to delete event {event_id}: {e}")
        return False
