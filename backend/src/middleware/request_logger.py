"""Request/response logger middleware."""
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from core.logger import get_logger

logger = get_logger("http")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)

        logger.info(
            f"{request.method} {request.url.path} "
            f"-> {response.status_code} ({duration_ms}ms)"
        )
        return response
