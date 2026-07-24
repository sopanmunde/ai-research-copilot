"""
src/services/event_notification_scheduler.py — Event Email Reminder Background Scheduler
========================================================================================
Periodically checks stored calendar events for upcoming email notification triggers
(2d, 1d, 5h, 1h, 30m, 5m, start) and dispatches email notifications.
"""
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from database.mongodb.connection import get_database
from core.constants import COLLECTION_EVENTS, COLLECTION_EMAILS
from core.logger import get_logger
from services.email_service import send_real_email

logger = get_logger(__name__)

NOTIFICATION_OFFSETS = {
    "2d": timedelta(days=2),
    "1d": timedelta(days=1),
    "5h": timedelta(hours=5),
    "1h": timedelta(hours=1),
    "30m": timedelta(minutes=30),
    "5m": timedelta(minutes=5),
    "start": timedelta(seconds=0),
}

OFFSET_LABELS = {
    "2d": "2 days before",
    "1d": "1 day before",
    "5h": "5 hours before",
    "1h": "1 hour before",
    "30m": "30 minutes before",
    "5m": "5 minutes before",
    "start": "Starting now",
}

_scheduler_task: Optional[asyncio.Task] = None


async def check_and_dispatch_event_notifications():
    """Scans all events and dispatches due email notifications."""
    db = get_database()
    if db is None:
        return

    now = datetime.now(timezone.utc)
    try:
        events = await db[COLLECTION_EVENTS].find({
            "emailNotifications": {"$exists": True, "$not": {"$size": 0}}
        }).to_list(1000)

        for event in events:
            event_from_str = event.get("from")
            if not event_from_str:
                continue

            try:
                event_start = datetime.fromisoformat(event_from_str.replace("Z", "+00:00"))
                if event_start.tzinfo is None:
                    event_start = event_start.replace(tzinfo=timezone.utc)
            except Exception:
                continue

            email_notifications = event.get("emailNotifications", [])
            sent_notifications = event.get("sentNotifications", [])
            target_email = event.get("notificationEmail") or "user@trivisionx.ai"
            user_id = event.get("user_id", "system")
            title = event.get("title", "Upcoming Meeting")

            newly_sent = []
            for notif_code in email_notifications:
                if notif_code in sent_notifications:
                    continue

                offset = NOTIFICATION_OFFSETS.get(notif_code)
                if offset is None:
                    continue

                trigger_time = event_start - offset
                # If current time is past or equal to trigger_time and not expired by more than 2 hours
                if now >= trigger_time and now <= (event_start + timedelta(hours=2)):
                    label = OFFSET_LABELS.get(notif_code, notif_code)
                    subject = f"[Reminder: {label}] {title}"
                    body = (
                        f"Hello,\n\n"
                        f"This is an automated email reminder for your upcoming calendar event:\n\n"
                        f"Event Title: {title}\n"
                        f"Scheduled Start: {event_start.strftime('%B %d, %Y at %I:%M %p UTC')}\n"
                        f"Reminder Timing: {label}\n"
                        f"Location: {event.get('location', 'N/A')}\n"
                        f"Description: {event.get('description', 'N/A')}\n\n"
                        f"Best regards,\nTriVisionX AI Assistant"
                    )

                    email_doc = {
                        "user_id": user_id,
                        "name": "TriVisionX Calendar Reminders",
                        "email": target_email,
                        "subject": subject,
                        "date": "Just now",
                        "fullDate": now.strftime("%b %d, %Y, %I:%M:%S %p"),
                        "snippet": f"Reminder ({label}): {title} at {event_start.strftime('%I:%M %p')}",
                        "body": body,
                        "tags": ["calendar", "reminder", "important"],
                        "unread": True,
                        "favorite": True,
                        "folder": "inbox",
                        "category": "updates",
                        "created_at": now
                    }
                    await db[COLLECTION_EMAILS].insert_one(email_doc)
                    newly_sent.append(notif_code)
                    logger.info(f"Dispatched in-app email reminder [{notif_code}] for event '{title}' to {target_email}")

                    # Attempt to send real SMTP email if credentials are set
                    try:
                        await send_real_email(to_email=target_email, subject=subject, body=body)
                    except Exception as email_err:
                        logger.error(f"Failed to send real SMTP email: {email_err}")

            if newly_sent:
                updated_sent = list(set(sent_notifications + newly_sent))
                await db[COLLECTION_EVENTS].update_one(
                    {"_id": event["_id"]},
                    {"$set": {"sentNotifications": updated_sent}}
                )
    except Exception as e:
        err_str = str(e)
        if "getaddrinfo failed" in err_str or "ServerSelectionTimeoutError" in err_str or "AutoReconnect" in err_str:
            logger.warning("MongoDB cluster unreachable for event notification check (network/DNS issue)")
        else:
            logger.error(f"Error checking event notifications: {e}")
        raise


async def _notification_loop():
    consecutive_errors = 0
    while True:
        try:
            await check_and_dispatch_event_notifications()
            consecutive_errors = 0
            sleep_time = 30
        except Exception:
            consecutive_errors += 1
            # Exponential backoff up to 2 minutes when DB is unreachable
            sleep_time = min(30 * (2 ** min(consecutive_errors - 1, 3)), 120)
        await asyncio.sleep(sleep_time)


async def start_event_scheduler():
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(_notification_loop())
        logger.info("[OK] Event Email Notification Scheduler active (30s poll)")


async def shutdown_event_scheduler():
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        logger.info("[OK] Event Email Notification Scheduler stopped")
