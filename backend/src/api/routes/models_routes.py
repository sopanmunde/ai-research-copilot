"""
src/api/routes/models_routes.py — Available AI models and configuration
========================================================================
GET /api/models  — returns all configured LLM providers, models, embeddings,
                   workflow types, and RAG settings. Used by the frontend
                   settings panel for model/provider selection.
"""
from fastapi import APIRouter
from core.config import settings
from core.llm_factory import get_available_providers
from core.constants import WORKFLOW_TYPES, DEFAULT_MODEL_MAP
from workflows.research_workflow import get_all_workflows
from core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/", summary="List available AI models, providers, and workflows")
async def get_models():
    """
    GET /api/models/

    Returns available LLM providers, their configuration status,
    all workflow types, embedding config, and current RAG settings.
    """
    available_providers = get_available_providers()
    configured_providers = {
        k: v for k, v in available_providers.items() if v
    }

    default_provider = (
        settings.DEFAULT_LLM_PROVIDER
        if available_providers.get(settings.DEFAULT_LLM_PROVIDER)
        else next(iter(configured_providers), settings.DEFAULT_LLM_PROVIDER)
    )

    return {
        "llm": {
            "default_provider": default_provider,
            "default_model": DEFAULT_MODEL_MAP.get(default_provider, ""),
            "available_providers": available_providers,
            "configured_providers": list(configured_providers.keys()),
            "models": DEFAULT_MODEL_MAP,
            "streaming": True,
        },
        "embeddings": {
            "provider": settings.EMBEDDING_PROVIDER,
            "model": settings.EMBEDDING_MODEL,
            "dimensions": settings.EMBEDDING_DIMENSION,
        },
        "rag": {
            "chunk_size": settings.CHUNK_SIZE,
            "chunk_overlap": settings.CHUNK_OVERLAP,
            "retrieval_top_k": settings.RETRIEVAL_TOP_K,
            "retrieval_strategy": "MMR (Maximal Marginal Relevance)",
            "mmr_lambda": 0.6,
        },
        "vector_store": {
            "provider": "Pinecone",
            "index": settings.PINECONE_INDEX_NAME,
            "environment": settings.PINECONE_ENVIRONMENT,
            "metric": "cosine",
        },
        "workflows": get_all_workflows(),
        "modes": {
            "quick": "Direct LLM call — fastest response, no agent orchestration",
            "agent": "Full LangGraph multi-agent pipeline with retrieval, citations, and structured output",
        },
        "pipeline": "LangGraph multi-workflow multi-agent system",
        "version": settings.VERSION,
    }
