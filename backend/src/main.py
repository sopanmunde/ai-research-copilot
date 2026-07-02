"""
src/main.py — FastAPI Application Factory (v3)
==============================================
Clean factory used by backend/index.py.
All routers, middleware, and lifespan events are registered here.

Architecture (matches image workflow):
  Frontend (Next.js) → JWT + SSE → FastAPI Gateway
    /api/auth     — Auth service (JWT · MongoDB Sessions)
    /api/chat     — RAG service + Agent service (LangGraph)
    /api/documents — Doc service (PDF/DOCX/TXT · Chunking)
    /api/reports  — Report service (Markdown · structured output)
    /api/conversations — Conversation history
    /api/health   — Health check
"""
print("Importing main.py... Fastapi")
import time
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import Response

from src.middleware.fastapi_compression import CompressionMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from src.core.limiter import limiter

in_flight_requests = 0
shutdown_started = False

class GracefulShutdownMiddleware:
    """
    Middleware that tracks the number of in-flight requests and rejects new requests
    with a 503 Service Unavailable error once a graceful shutdown begins.
    """
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        global in_flight_requests, shutdown_started
        
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        if shutdown_started:
            response = Response("Service Unavailable", status_code=503)
            await response(scope, receive, send)
            return

        in_flight_requests += 1
        try:
            await self.app(scope, receive, send)
        finally:
            in_flight_requests -= 1


async def drain_inflight_requests(timeout: float):
    """
    Waits for all active in-flight requests to finish, up to the timeout.
    """
    global shutdown_started, in_flight_requests
    shutdown_started = True
    
    logger = get_logger("src.main.shutdown")
    logger.info(f"Draining in-flight requests. Currently active: {in_flight_requests}")
    start_time = time.time()
    
    while in_flight_requests > 0:
        elapsed = time.time() - start_time
        if elapsed >= timeout:
            logger.warning(f"Timeout reached. Force-closing remaining {in_flight_requests} requests.")
            break
        await asyncio.sleep(0.1)
        
    logger.info("In-flight requests successfully drained.")


def register_signal_handlers():
    """
    Cooperatively registers SIGINT and SIGTERM handlers to intercept shutdown
    signals without breaking Uvicorn's termination loop.
    """
    import signal
    logger = get_logger("src.main.signals")
    original_handlers = {}

    def handle_signal(sig, frame):
        logger.info(f"Received shutdown signal {sig}. Initiating graceful cleanup...")
        orig_handler = original_handlers.get(sig)
        if orig_handler and callable(orig_handler):
            orig_handler(sig, frame)

    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            original_handlers[sig] = signal.getsignal(sig)
            signal.signal(sig, handle_signal)
            logger.info(f"Cooperative signal handler registered for signal {sig}")
        except ValueError:
            pass

print("Importing config...")
from src.core.config import settings
from src.core.logger import get_logger
print("Importing mongo indexes...")
from src.database.mongodb.indexes import create_indexes
from src.middleware.request_logger import RequestLoggerMiddleware

print("Importing routers...")
from src.api.routes.auth_routes import router as auth_router
from src.api.routes.google_auth import router as google_auth_router
from src.api.routes.github_auth import router as github_auth_router
from src.api.routes.chat_routes import router as chat_router
from src.api.routes.upload_routes import router as upload_router
from src.api.routes.report_routes import router as report_router
from src.api.routes.contact_routes import router as contact_router
from src.api.routes.health_routes import router as health_router
from src.api.routes.models_routes import router as models_router
from src.api.conversations import router as conversations_router

logger = get_logger(__name__)
print("main.py imports complete.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup: initialise all external connections.
    All failures are non-fatal (warnings) so the app can start degraded.
    """
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    register_signal_handlers()

    try:
        await create_indexes()
        logger.info("[OK] MongoDB indexes ready")
    except Exception as e:
        logger.error(f"MongoDB index creation failed: {e}")

    try:
        from src.rag.vectorstores.pinecone_store import get_vector_store
        get_vector_store()
        logger.info("[OK] Pinecone vector store connected")
    except Exception as e:
        logger.warning(f"Pinecone connection failed (non-fatal): {e}")

    try:
        from src.agents.langgraph.graph import get_graph
        get_graph()
        logger.info("[OK] LangGraph 5-agent workflow compiled")
    except Exception as e:
        logger.warning(f"LangGraph compilation failed (non-fatal): {e}")

    try:
        from src.core.cache import _get_client
        client = await _get_client()
        if client:
            logger.info("[OK] Redis cache connected")
        else:
            logger.info("Redis cache disabled (REDIS_URL not set)")
    except Exception as e:
        logger.warning(f"Redis check failed (non-fatal): {e}")

    logger.info("Application ready [OK]")
    yield
    logger.info("Graceful shutdown started...")
    shutdown_start = time.time()
    
    try:
        from src.services.chat_service import signal_sse_shutdown
        await signal_sse_shutdown()
        logger.info(f"[OK] SSE streams notified in {time.time() - shutdown_start:.4f}s")
    except Exception as e:
        logger.warning(f"Failed to signal SSE shutdown: {e}")

    try:
        t_start = time.time()
        await drain_inflight_requests(timeout=8.0)
        logger.info(f"[OK] In-flight requests drained in {time.time() - t_start:.4f}s")
    except Exception as e:
        logger.warning(f"Failed to drain in-flight requests: {e}")

    try:
        t_start = time.time()
        from src.database.mongodb.connection import get_mongo_client
        get_mongo_client().close()
        logger.info(f"[OK] MongoDB client connection closed in {time.time() - t_start:.4f}s")
    except Exception as e:
        logger.warning(f"Failed to close MongoDB client: {e}")

    try:
        t_start = time.time()
        from src.core.cache import _get_client
        client = await _get_client()
        if client is not None:
            await client.close()
            logger.info(f"[OK] Redis client connection closed in {time.time() - t_start:.4f}s")
    except Exception as e:
        logger.warning(f"Failed to close Redis client: {e}")

    try:
        t_start = time.time()
        from src.core.http import close_http_client
        await close_http_client()
        logger.info(f"[OK] Shared HTTP client closed in {time.time() - t_start:.4f}s")
    except Exception as e:
        logger.warning(f"Failed to close shared HTTP client: {e}")

    logger.info(f"Shutdown complete in {time.time() - shutdown_start:.2f}s")


def create_app() -> FastAPI:
    """Application factory — returns a configured FastAPI instance."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=(
            "TriVisionX — LangGraph 5-agent pipeline · "
            "Pinecone MMR retrieval · GPT-4o synthesis · MongoDB + Redis"
        ),
        version=settings.VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    origins = [
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "https://trivisionx-ai.vercel.app",
    ]
    origins = list(dict.fromkeys(o for o in origins if o))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
    app.add_middleware(RequestLoggerMiddleware)
    app.add_middleware(
        CompressionMiddleware,
        minimum_size=1000,
        exclude_paths=["/api/chat/"],
    )
    app.add_middleware(GracefulShutdownMiddleware)

    app.include_router(auth_router,          prefix="/api/auth",                tags=["auth"])
    app.include_router(google_auth_router,   prefix="/api/auth/google",         tags=["auth-google"])
    app.include_router(github_auth_router,   prefix="/api/auth/github",         tags=["auth-github"])
    app.include_router(auth_router,          prefix="/api",                     tags=["auth-legacy"])
    app.include_router(conversations_router, prefix="/api/conversations",       tags=["conversations"])
    app.include_router(chat_router,          prefix="/api/chat",                tags=["chat"])
    app.include_router(upload_router,        prefix="/api/documents",           tags=["documents"])
    app.include_router(report_router,        prefix="/api/reports",             tags=["reports"])
    app.include_router(contact_router,       prefix="/api/contact",             tags=["contact"])
    app.include_router(report_router,        prefix="/api/research-sessions",   tags=["research-sessions"])
    app.include_router(models_router,        prefix="/api/models",              tags=["models"])
    app.include_router(health_router,        prefix="/api/health",              tags=["health"])

    @app.get("/", tags=["root"])
    async def root():
        return {
            "message": f"{settings.PROJECT_NAME} is running",
            "version": settings.VERSION,
            "docs": "/docs",
        }

    return app
