"""Integrations routes — API endpoints to manage user integration configurations."""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any
from src.core.security import get_current_user
from src.core.limiter import limiter
from src.core.constants import RATE_LIMIT_DEFAULT
from src.database.mongodb.repositories.integrations_repository import (
    get_integrations,
    update_integrations,
)
from src.core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("", response_model=Dict[str, Any])
@limiter.limit(RATE_LIMIT_DEFAULT)
async def list_integrations(request: Request, current_user=Depends(get_current_user)):
    """Retrieve all integration settings for the current user."""
    user_id = str(current_user["_id"])
    return await get_integrations(user_id)


@router.put("", response_model=Dict[str, Any])
@limiter.limit(RATE_LIMIT_DEFAULT)
async def modify_integrations(
    request: Request,
    data: Dict[str, Any],
    current_user=Depends(get_current_user),
):
    """Update user integration settings."""
    user_id = str(current_user["_id"])
    return await update_integrations(user_id, data)
