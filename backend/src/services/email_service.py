"""
src/services/email_service.py — Service to send real emails via SMTP
===================================================================
Uses standard smtplib inside asyncio.to_thread to send emails without blocking.
"""
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings
from core.logger import get_logger

logger = get_logger(__name__)


def _send_smtp_sync(to_email: str, subject: str, body: str) -> bool:
    """Synchronous SMTP email sending execution."""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning("SMTP username or password not configured in .env. Real email dispatch skipped.")
        return False

    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    
    # Create email message
    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    
    msg.attach(MIMEText(body, "plain"))
    
    try:
        # Establish connection with the SMTP server
        logger.info(f"Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        server.starttls()  # Secure the connection using TLS
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        
        # Send the email
        logger.info(f"Sending SMTP email to {to_email}...")
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Successfully sent email to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMTP email to {to_email}: {e}")
        return False


async def send_real_email(to_email: str, subject: str, body: str) -> bool:
    """Asynchronous wrapper to send email via SMTP in a separate thread."""
    return await asyncio.to_thread(_send_smtp_sync, to_email, subject, body)
