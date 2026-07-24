"""Report routes — generate, retrieve, export, and publish research reports."""
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, Dict, Any
from bson import ObjectId

from core.limiter import limiter
from core.constants import RATE_LIMIT_REPORT, COLLECTION_REPORTS
from core.security import get_current_user
from database.mongodb.connection import get_database
from services.report_service import create_report
from rag.memory.research_memory import get_research_sessions
from utils.markdown_export import build_markdown_report
from services.export_service import (
    generate_pdf_report,
    generate_docx_report,
    generate_xlsx_report,
)
from services.third_party_integrations import (
    send_slack_webhook,
    send_teams_webhook,
    publish_to_notion,
    publish_to_confluence,
)
from database.mongodb.repositories.integrations_repository import get_integrations

router = APIRouter()


class ReportRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    top_k: int = 10


async def _get_report_or_404(report_id: str, user_id: str) -> Dict[str, Any]:
    db = get_database()
    try:
        obj_id = ObjectId(report_id)
        doc = await db[COLLECTION_REPORTS].find_one({"_id": obj_id, "user_id": user_id})
    except Exception:
        doc = None
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    return doc


@router.post("/generate")
@limiter.limit(RATE_LIMIT_REPORT)
async def generate_report_endpoint(
    request: Request,
    report_req: ReportRequest,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    db = get_database()

    result = await create_report(
        query=report_req.query,
        user_id=user_id,
        conversation_id=report_req.conversation_id,
        reports_collection=db[COLLECTION_REPORTS],
        top_k=report_req.top_k,
    )
    return result


@router.get("/history")
async def get_report_history(current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    db = get_database()
    return await get_research_sessions(db[COLLECTION_REPORTS], user_id)


@router.get("/{report_id}/export")
async def export_report_markdown(
    report_id: str,
    current_user=Depends(get_current_user),
):
    """Download a report as a .md file."""
    user_id = str(current_user["_id"])
    doc = await _get_report_or_404(report_id, user_id)

    md = build_markdown_report(
        query=doc.get("query", ""),
        report_text=doc.get("final_output", ""),
        citations=doc.get("citations", []),
    )
    return Response(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="report-{report_id}.md"'},
    )


@router.get("/{report_id}/export/pdf")
async def export_report_pdf(
    report_id: str,
    current_user=Depends(get_current_user),
):
    """Download a formatted research report as a PDF document."""
    user_id = str(current_user["_id"])
    doc = await _get_report_or_404(report_id, user_id)
    integrations = await get_integrations(user_id)
    export_cfg = integrations.get("export", {})

    pdf_bytes = generate_pdf_report(
        query=doc.get("query", ""),
        report_text=doc.get("final_output", ""),
        citations=doc.get("citations", []),
        company_name=export_cfg.get("companyName", "TriVisionX Enterprise"),
        logo_url=export_cfg.get("logoUrl"),
        footer_text=export_cfg.get("footerText", "Confidential • TriVisionX AI Research"),
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report-{report_id}.pdf"'},
    )


@router.get("/{report_id}/export/docx")
async def export_report_docx(
    report_id: str,
    current_user=Depends(get_current_user),
):
    """Download a research report as a Microsoft Word (.docx) document."""
    user_id = str(current_user["_id"])
    doc = await _get_report_or_404(report_id, user_id)
    integrations = await get_integrations(user_id)
    export_cfg = integrations.get("export", {})

    docx_bytes = generate_docx_report(
        query=doc.get("query", ""),
        report_text=doc.get("final_output", ""),
        citations=doc.get("citations", []),
        company_name=export_cfg.get("companyName", "TriVisionX Enterprise"),
        footer_text=export_cfg.get("footerText", "Confidential • TriVisionX AI Research"),
    )
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="report-{report_id}.docx"'},
    )


@router.get("/{report_id}/export/xlsx")
async def export_report_xlsx(
    report_id: str,
    current_user=Depends(get_current_user),
):
    """Download a research report and citations as an Excel (.xlsx) workbook."""
    user_id = str(current_user["_id"])
    doc = await _get_report_or_404(report_id, user_id)

    xlsx_bytes = generate_xlsx_report(
        query=doc.get("query", ""),
        report_text=doc.get("final_output", ""),
        citations=doc.get("citations", []),
    )
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="report-{report_id}.xlsx"'},
    )


@router.post("/{report_id}/publish/slack")
async def publish_report_slack(
    report_id: str,
    current_user=Depends(get_current_user),
):
    """Push report summary to Slack channel via configured webhook."""
    user_id = str(current_user["_id"])
    doc = await _get_report_or_404(report_id, user_id)
    integrations = await get_integrations(user_id)
    slack_cfg = integrations.get("slack", {})

    if not slack_cfg.get("webhookUrl"):
        raise HTTPException(status_code=400, detail="Slack Incoming Webhook URL is not configured in Integrations Hub")

    res = await send_slack_webhook(
        webhook_url=slack_cfg["webhookUrl"],
        query=doc.get("query", ""),
        summary=doc.get("final_output", ""),
        citations_count=len(doc.get("citations", [])),
        channel_name=slack_cfg.get("channelName", "#research-reports"),
    )
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Failed to push to Slack"))
    return res


@router.post("/{report_id}/publish/teams")
async def publish_report_teams(
    report_id: str,
    current_user=Depends(get_current_user),
):
    """Push report summary to Microsoft Teams channel via webhook."""
    user_id = str(current_user["_id"])
    doc = await _get_report_or_404(report_id, user_id)
    integrations = await get_integrations(user_id)
    teams_cfg = integrations.get("teams", {})

    if not teams_cfg.get("webhookUrl"):
        raise HTTPException(status_code=400, detail="MS Teams Webhook URL is not configured in Integrations Hub")

    res = await send_teams_webhook(
        webhook_url=teams_cfg["webhookUrl"],
        query=doc.get("query", ""),
        summary=doc.get("final_output", ""),
        citations_count=len(doc.get("citations", [])),
    )
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Failed to push to MS Teams"))
    return res


@router.post("/{report_id}/publish/notion")
async def publish_report_notion(
    report_id: str,
    current_user=Depends(get_current_user),
):
    """Publish report to Notion workspace page."""
    user_id = str(current_user["_id"])
    doc = await _get_report_or_404(report_id, user_id)
    integrations = await get_integrations(user_id)
    notion_cfg = integrations.get("notion", {})

    if not notion_cfg.get("apiKey"):
        raise HTTPException(status_code=400, detail="Notion API key is not configured in Integrations Hub")

    res = await publish_to_notion(
        api_key=notion_cfg["apiKey"],
        parent_page_id=notion_cfg.get("parentPageId", ""),
        database_id=notion_cfg.get("databaseId", ""),
        query=doc.get("query", ""),
        report_text=doc.get("final_output", ""),
        citations=doc.get("citations", []),
    )
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Failed to publish to Notion"))
    return res


@router.post("/{report_id}/publish/confluence")
async def publish_report_confluence(
    report_id: str,
    current_user=Depends(get_current_user),
):
    """Publish report as a Confluence page."""
    user_id = str(current_user["_id"])
    doc = await _get_report_or_404(report_id, user_id)
    integrations = await get_integrations(user_id)
    conf_cfg = integrations.get("confluence", {})

    if not conf_cfg.get("domain") or not conf_cfg.get("apiToken"):
        raise HTTPException(status_code=400, detail="Confluence credentials missing in Integrations Hub")

    res = await publish_to_confluence(
        domain=conf_cfg["domain"],
        email=conf_cfg.get("email", ""),
        api_token=conf_cfg["apiToken"],
        space_key=conf_cfg.get("spaceKey", "RESEARCH"),
        query=doc.get("query", ""),
        report_text=doc.get("final_output", ""),
        citations=doc.get("citations", []),
    )
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Failed to publish to Confluence"))
    return res
