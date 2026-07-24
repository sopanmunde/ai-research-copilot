"""
src/api/routes/audit_routes.py — Audit Trail API for Explainable AI
===================================================================
Provides endpoints to inspect query audit trails, execution steps,
citations confidence scores, and source heatmaps.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from core.security import get_current_user
from database.mongodb.repositories.audit_log_repository import (
    get_user_audit_logs,
    get_audit_log_by_id,
    get_conversation_audit_logs,
)
from core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("", summary="Get audit logs history for the current user")
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    search: Optional[str] = Query(None, description="Search query text or model provider"),
    current_user=Depends(get_current_user),
):
    """
    Returns audit log history for the authenticated user.
    """
    user_id = str(current_user["_id"])
    logs = await get_user_audit_logs(user_id=user_id, limit=limit, skip=skip, search=search)
    return {"audit_logs": logs, "total": len(logs), "limit": limit, "skip": skip}


@router.get("/conversation/{conversation_id}", summary="Get audit logs for a conversation")
async def get_conversation_logs(
    conversation_id: str,
    current_user=Depends(get_current_user),
):
    """
    Returns all audit log records associated with a specific conversation ID.
    """
    user_id = str(current_user["_id"])
    logs = await get_conversation_audit_logs(conversation_id=conversation_id, user_id=user_id)
    return {"audit_logs": logs, "conversation_id": conversation_id}


@router.get("/{log_id}", summary="Get audit log details by ID")
async def get_audit_log_detail(
    log_id: str,
    current_user=Depends(get_current_user),
):
    """
    Returns full details for a single audit log entry by ID.
    """
    user_id = str(current_user["_id"])
    log = await get_audit_log_by_id(log_id=log_id, user_id=user_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log record not found.",
        )
    return log
