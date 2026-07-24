"""Event routes — REST API endpoints for calendar events management in MongoDB."""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, List
from core.security import get_current_user
from core.limiter import limiter
from core.constants import RATE_LIMIT_DEFAULT
from database.mongodb.repositories.event_repository import (
    get_user_events,
    create_event,
    delete_event_metadata,
)
from core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("", response_model=List[Dict])
@limiter.limit(RATE_LIMIT_DEFAULT)
async def list_events(request: Request, current_user=Depends(get_current_user)):
    """Retrieve all calendar events for the active user."""
    user_id = str(current_user["_id"])
    return await get_user_events(user_id)


@router.post("", response_model=Dict)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def add_event(request: Request, event_data: Dict, current_user=Depends(get_current_user)):
    """Create a new calendar event."""
    user_id = str(current_user["_id"])
    return await create_event(user_id, event_data)


@router.delete("/{event_id}")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def remove_event(request: Request, event_id: str, current_user=Depends(get_current_user)):
    """Delete a calendar event."""
    user_id = str(current_user["_id"])
    success = await delete_event_metadata(user_id, event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found or could not be deleted")
    return {"message": "Event deleted successfully"}
