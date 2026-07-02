"""Prompt injection guard — sanitizes user input before LLM processing."""
import re
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.logger import get_logger

logger = get_logger("security")

INJECTION_PATTERNS = [
    r"ignore\s+previous\s+instructions",
    r"disregard\s+all\s+prior",
    r"you\s+are\s+now\s+(?:a\s+)?(?:dan|jailbreak|evil)",
    r"system\s*:\s*you\s+are",
    r"<\s*/?system\s*>",
    r"\bact\s+as\s+if\s+you\s+have\s+no\s+restrictions\b",
    r"pretend\s+you\s+are\s+not\s+an\s+ai",
]

COMPILED = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

BLOCKED_PATHS = {"/api/chat/"}


def scan_text(text: str) -> bool:
    """Returns True if injection patterns are detected."""
    return any(p.search(text) for p in COMPILED)


def sanitize(text: str) -> str:
    """Remove potentially harmful control sequences."""
    text = text.replace("\x00", "").strip()
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text
