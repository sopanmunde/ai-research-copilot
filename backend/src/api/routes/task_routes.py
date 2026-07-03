"""Task routes — API endpoints to manage tasks in MongoDB."""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, List
from src.core.security import get_current_user
from src.core.limiter import limiter
from src.core.constants import RATE_LIMIT_DEFAULT
from src.database.mongodb.repositories.task_repository import (
    get_user_tasks,
    create_task,
    update_task_db,
    delete_task_metadata,
)
from src.core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("", response_model=List[Dict])
@limiter.limit(RATE_LIMIT_DEFAULT)
async def list_tasks(request: Request, current_user=Depends(get_current_user)):
    """Retrieve all tasks for the current user."""
    user_id = str(current_user["_id"])
    return await get_user_tasks(user_id)


@router.post("", response_model=Dict)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def add_task(request: Request, task_data: Dict, current_user=Depends(get_current_user)):
    """Create a new task in the database."""
    user_id = str(current_user["_id"])
    return await create_task(user_id, task_data)


@router.put("/{task_id}", response_model=Dict)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def edit_task(
    request: Request,
    task_id: str,
    task_update: Dict,
    current_user=Depends(get_current_user),
):
    """Update properties of an existing task."""
    user_id = str(current_user["_id"])
    updated_task = await update_task_db(user_id, task_id, task_update)
    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found or could not be updated")
    return updated_task


@router.delete("/{task_id}")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def remove_task(request: Request, task_id: str, current_user=Depends(get_current_user)):
    """Delete a task from the database."""
    user_id = str(current_user["_id"])
    success = await delete_task_metadata(user_id, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or could not be deleted")
    return {"message": "Task deleted successfully"}
