"""Task routes — API endpoints to manage tasks in MongoDB and export to external tools."""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from typing import Dict, List
from core.security import get_current_user
from core.limiter import limiter
from core.constants import RATE_LIMIT_DEFAULT
from database.mongodb.repositories.task_repository import (
    get_user_tasks,
    create_task,
    update_task_db,
    delete_task_metadata,
)
from database.mongodb.repositories.integrations_repository import get_integrations
from services.third_party_integrations import create_jira_issue
from services.export_service import generate_xlsx_report
from core.logger import get_logger

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


@router.get("/export/excel")
async def export_tasks_excel(
    request: Request,
    current_user=Depends(get_current_user),
):
    """Download user tasks as an Excel (.xlsx) spreadsheet."""
    user_id = str(current_user["_id"])
    tasks = await get_user_tasks(user_id)

    xlsx_bytes = generate_xlsx_report(
        query="Task Board Export",
        report_text="Task list export from TriVisionX AI Task Board.",
        tasks=tasks,
    )
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="task-board.xlsx"'},
    )


@router.get("/export/pdf")
async def export_tasks_pdf(
    request: Request,
    current_user=Depends(get_current_user),
):
    """Download user tasks as a formatted PDF document."""
    user_id = str(current_user["_id"])
    tasks = await get_user_tasks(user_id)
    summary = _format_tasks_summary(tasks)

    pdf_bytes = generate_pdf_report(
        query="Task Board Export",
        report_text=summary,
        citations=[],
        company_name="TriVisionX Enterprise",
        footer_text="Confidential • TriVisionX AI Task Board",
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="task-board.pdf"'},
    )


@router.get("/export/docx")
async def export_tasks_docx(
    request: Request,
    current_user=Depends(get_current_user),
):
    """Download user tasks as a Microsoft Word (.docx) document."""
    user_id = str(current_user["_id"])
    tasks = await get_user_tasks(user_id)
    summary = _format_tasks_summary(tasks)

    docx_bytes = generate_docx_report(
        query="Task Board Export",
        report_text=summary,
        citations=[],
        company_name="TriVisionX Enterprise",
        footer_text="Confidential • TriVisionX AI Task Board",
    )
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": 'attachment; filename="task-board.docx"'},
    )


@router.get("/export")
@router.get("/export/md")
async def export_tasks_markdown(
    request: Request,
    current_user=Depends(get_current_user),
):
    """Download user tasks as a Markdown (.md) file."""
    user_id = str(current_user["_id"])
    tasks = await get_user_tasks(user_id)
    summary = _format_tasks_summary(tasks)
    md_content = f"# Task Board Export\n\n{summary}\n"

    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="task-board.md"'},
    )


@router.post("/{task_id}/export/jira")
async def export_task_to_jira(
    request: Request,
    task_id: str,
    current_user=Depends(get_current_user),
):
    """Create a Jira ticket from a task item using configured Jira integration."""
    user_id = str(current_user["_id"])
    tasks = await get_user_tasks(user_id)
    
    task_item = next((t for t in tasks if t.get("id") == task_id or str(t.get("_id")) == task_id), None)
    if not task_item:
        raise HTTPException(status_code=404, detail="Task item not found")

    integrations = await get_integrations(user_id)
    jira_cfg = integrations.get("jira", {})

    if not jira_cfg.get("domain") or not jira_cfg.get("apiToken"):
        raise HTTPException(status_code=400, detail="Jira credentials are not configured in Integrations Hub")

    res = await create_jira_issue(
        domain=jira_cfg["domain"],
        email=jira_cfg.get("email", ""),
        api_token=jira_cfg["apiToken"],
        project_key=jira_cfg.get("projectKey", "AI"),
        summary=task_item.get("title", "Task Item"),
        description=task_item.get("description", "Created from TriVisionX Task Board"),
        issue_type=jira_cfg.get("defaultIssueType", "Task"),
        priority=task_item.get("priority", "Medium").capitalize(),
    )

    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Failed to create Jira issue"))
    return res
