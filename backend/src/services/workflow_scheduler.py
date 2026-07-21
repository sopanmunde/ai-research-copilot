"""
src/services/workflow_scheduler.py — APScheduler Proactive Automation Engine
=============================================================================
Orchestrates scheduled cron agent pipelines and event-driven automation triggers.
"""
import asyncio
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from src.database.mongodb.repositories.workflow_repository import (
    get_active_scheduled_workflows,
    get_active_event_workflows,
    get_workflow_by_id,
    record_workflow_log,
)
from src.core.logger import get_logger

logger = get_logger(__name__)

_scheduler: Optional[AsyncIOScheduler] = None


async def execute_workflow_job(workflow_id: str, trigger_source: str = "cron", payload: Optional[Dict[str, Any]] = None):
    """
    Executes a single workflow automation pipeline.
    Runs the agent research pipeline with the workflow's configured query prompt.
    """
    start_time = time.time()
    logger.info(f"[Workflow Engine] Executing workflow {workflow_id} (trigger: {trigger_source})")

    workflow = await get_workflow_by_id(workflow_id)
    if not workflow or not workflow.get("is_active"):
        logger.warning(f"[Workflow Engine] Workflow {workflow_id} is inactive or missing. Skipping.")
        return

    user_id = workflow.get("user_id")
    query_prompt = workflow.get("query_prompt", "Summarize latest document insights.")
    if payload and "filename" in payload:
        query_prompt += f" Document: {payload['filename']}"

    workflow_type = workflow.get("workflow_type", "research")
    provider = workflow.get("model_provider", "google")

    try:
        from src.agents.langgraph.graph import get_graph
        graph = get_graph(workflow_type)

        initial_state = {
            "query": query_prompt,
            "conversation_id": None,
            "user_id": user_id,
            "filename": payload.get("filename") if payload else None,
            "report_mode": False,
            "mode": "agent",
            "workflow_type": workflow_type,
            "selected_llm_provider": provider,
            "selected_llm_model": "",
            "requires_context": True,
            "is_voice": False,
            "history": [],
            "messages": [],
            "plan": [],
            "retrieved_docs": [],
            "citations": [],
            "summary": "",
            "final_output": "",
            "generated_code": "",
            "code_review": "",
            "test_results": "",
            "analysis_results": "",
            "visualization_data": {},
            "errors": [],
            "current_node": "",
        }

        output_text = ""
        node_steps = []

        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event.get("event", "")
            name = event.get("name", "")
            data = event.get("data", {})

            if kind == "on_chain_end" and name in (
                "planner", "memory_retriever", "retriever", "web_researcher", "citation", "summarizer", "reporter",
            ):
                output = data.get("output", {}) or {}
                node_steps.append({"node": name, "status": "completed", "output": str(output)[:200]})
                if name in ("reporter", "summarizer") and output.get("final_output"):
                    output_text = output.get("final_output")

        duration_ms = int((time.time() - start_time) * 1000)
        log_data = {
            "workflow_id": workflow_id,
            "user_id": user_id,
            "workflow_title": workflow.get("title"),
            "trigger_source": trigger_source,
            "query_prompt": query_prompt,
            "status": "success",
            "output_summary": output_text[:500] if output_text else "Execution completed successfully.",
            "execution_steps": node_steps,
            "duration_ms": duration_ms,
            "executed_at": datetime.now(timezone.utc).isoformat(),
        }
        await record_workflow_log(log_data)
        logger.info(f"[Workflow Engine] Successfully completed workflow {workflow_id} in {duration_ms}ms")

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error(f"[Workflow Engine] Failed executing workflow {workflow_id}: {e}", exc_info=True)
        log_data = {
            "workflow_id": workflow_id,
            "user_id": user_id,
            "workflow_title": workflow.get("title"),
            "trigger_source": trigger_source,
            "query_prompt": query_prompt,
            "status": "failed",
            "error": str(e),
            "execution_steps": [],
            "duration_ms": duration_ms,
            "executed_at": datetime.now(timezone.utc).isoformat(),
        }
        await record_workflow_log(log_data)


async def trigger_event_workflows(event_type: str, user_id: Optional[str] = None, payload: Optional[Dict[str, Any]] = None):
    """
    Event Hook: Finds and triggers all active event-based workflows for a user.
    """
    try:
        workflows = await get_active_event_workflows(event_type, user_id)
        if not workflows:
            return

        logger.info(f"[Workflow Engine] Event '{event_type}' triggered {len(workflows)} automated workflows.")
        for wf in workflows:
            asyncio.create_task(execute_workflow_job(wf["id"], trigger_source=f"event:{event_type}", payload=payload))
    except Exception as e:
        logger.error(f"[Workflow Engine] Error dispatching event workflows for {event_type}: {e}")


def sync_schedule_workflow(workflow: Dict[str, Any]):
    """
    Schedules or reschedules a single cron workflow in APScheduler.
    """
    global _scheduler
    if not _scheduler or not _scheduler.running:
        return

    wf_id = workflow["id"]
    job_id = f"wf_{wf_id}"

    # Remove existing job if any
    if _scheduler.get_job(job_id):
        _scheduler.remove_job(job_id)

    if not workflow.get("is_active") or workflow.get("trigger_type") != "cron":
        return

    cron_str = workflow.get("cron_expression", "0 8 * * 1")
    try:
        trigger = CronTrigger.from_crontab(cron_str)
        _scheduler.add_job(
            execute_workflow_job,
            trigger=trigger,
            args=[wf_id, "cron"],
            id=job_id,
            name=workflow.get("title", f"Workflow {wf_id}"),
            replace_existing=True,
        )
        logger.info(f"[Workflow Engine] Scheduled cron job '{job_id}' with schedule '{cron_str}'")
    except Exception as e:
        logger.error(f"[Workflow Engine] Invalid cron expression '{cron_str}' for workflow {wf_id}: {e}")


async def start_scheduler():
    """
    Initializes and starts APScheduler during FastAPI startup.
    Loads active cron workflows from MongoDB.
    """
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        return

    logger.info("[Workflow Engine] Initializing APScheduler engine...")
    _scheduler = AsyncIOScheduler()
    _scheduler.start()

    try:
        active_scheduled = await get_active_scheduled_workflows()
        logger.info(f"[Workflow Engine] Loading {len(active_scheduled)} active scheduled workflows from MongoDB...")
        for wf in active_scheduled:
            sync_schedule_workflow(wf)
    except Exception as e:
        logger.error(f"[Workflow Engine] Failed to load initial workflows: {e}")

    logger.info("[OK] APScheduler workflow engine running")


async def shutdown_scheduler():
    """
    Shuts down APScheduler gracefully on server exit.
    """
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        logger.info("[Workflow Engine] Stopping APScheduler...")
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("[OK] APScheduler stopped")
