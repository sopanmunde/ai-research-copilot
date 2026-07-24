"""
src/api/routes/workflow_routes.py — REST API for Proactive Workflow Automation
=============================================================================
Provides endpoints to manage scheduled cron pipelines and event triggers.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from typing import Dict, List, Any
from core.security import get_current_user
from database.mongodb.repositories.workflow_repository import (
    create_workflow,
    get_user_workflows,
    get_workflow_by_id,
    update_workflow_db,
    delete_workflow_db,
    get_workflow_logs_db,
)
from services.workflow_scheduler import (
    sync_schedule_workflow,
    execute_workflow_job,
)
from core.limiter import limiter
from core.constants import RATE_LIMIT_DEFAULT
from core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("", summary="List all workflow automations for current user")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def list_workflows(request: Request, current_user=Depends(get_current_user)):
    """Retrieve all user automation workflows."""
    user_id = str(current_user["_id"])
    return await get_user_workflows(user_id)


@router.post("", summary="Create a new scheduled or event-driven workflow")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def add_workflow(request: Request, workflow_data: Dict[str, Any], current_user=Depends(get_current_user)):
    """Create a new automation workflow definition."""
    user_id = str(current_user["_id"])
    wf = await create_workflow(user_id, workflow_data)
    if wf and wf.get("trigger_type") == "cron":
        sync_schedule_workflow(wf)
    return wf


@router.get("/{workflow_id}", summary="Get workflow details")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def get_workflow(request: Request, workflow_id: str, current_user=Depends(get_current_user)):
    """Fetch a single workflow by ID."""
    user_id = str(current_user["_id"])
    wf = await get_workflow_by_id(workflow_id, user_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.put("/{workflow_id}", summary="Update workflow definition & schedule")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def update_workflow(
    request: Request, workflow_id: str, updates: Dict[str, Any], current_user=Depends(get_current_user)
):
    """Update workflow settings and refresh scheduler job."""
    user_id = str(current_user["_id"])
    updated = await update_workflow_db(workflow_id, user_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Workflow not found or update failed")
    sync_schedule_workflow(updated)
    return updated


@router.delete("/{workflow_id}", summary="Delete workflow definition")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def remove_workflow(request: Request, workflow_id: str, current_user=Depends(get_current_user)):
    """Delete a workflow definition."""
    user_id = str(current_user["_id"])
    success = await delete_workflow_db(workflow_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow not found or could not be deleted")
    # Deschedule
    sync_schedule_workflow({"id": workflow_id, "is_active": False})
    return {"message": "Workflow deleted successfully"}


@router.post("/{workflow_id}/run", summary="Trigger immediate manual workflow run")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def run_workflow_now(
    request: Request, workflow_id: str, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)
):
    """Triggers an immediate test execution of a workflow pipeline."""
    user_id = str(current_user["_id"])
    wf = await get_workflow_by_id(workflow_id, user_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    background_tasks.add_task(execute_workflow_job, workflow_id, "manual")
    return {"message": f"Workflow '{wf.get('title')}' execution queued successfully", "workflow_id": workflow_id}


@router.get("/{workflow_id}/logs", summary="Get execution run logs for a workflow")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def get_workflow_logs(request: Request, workflow_id: str, current_user=Depends(get_current_user)):
    """Retrieve execution log history for a workflow."""
    user_id = str(current_user["_id"])
    return await get_workflow_logs_db(workflow_id, user_id)
