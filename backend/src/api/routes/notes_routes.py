"""Notes routes — REST API endpoints for user notes dashboard."""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, List
from core.security import get_current_user
from core.limiter import limiter
from core.constants import RATE_LIMIT_DEFAULT
from database.mongodb.repositories.notes_repository import (
    get_user_notes,
    create_note_db,
    update_note_db,
    delete_note_db,
)
from core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("", response_model=List[Dict])
@limiter.limit(RATE_LIMIT_DEFAULT)
async def list_notes(request: Request, current_user=Depends(get_current_user)):
    """Retrieve all user notes."""
    user_id = str(current_user["_id"])
    return await get_user_notes(user_id)


@router.post("", response_model=Dict)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def create_note(request: Request, note_data: Dict, current_user=Depends(get_current_user)):
    """Create a new note."""
    user_id = str(current_user["_id"])
    return await create_note_db(user_id, note_data)


@router.put("/{note_id}", response_model=Dict)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def update_note(request: Request, note_id: str, updates: Dict, current_user=Depends(get_current_user)):
    """Update note parameters (title, content, category, favorite)."""
    user_id = str(current_user["_id"])
    result = await update_note_db(user_id, note_id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Note not found or updates empty")
    return result


@router.delete("/{note_id}")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def delete_note(request: Request, note_id: str, current_user=Depends(get_current_user)):
    """Delete a note."""
    user_id = str(current_user["_id"])
    success = await delete_note_db(user_id, note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found or could not be deleted")
    return {"message": "Note deleted successfully"}
