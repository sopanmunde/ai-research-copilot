"""Brain routes — REST API endpoints for LLM configurations, api keys, and chat playground in MongoDB."""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, List
from src.core.security import get_current_user
from src.core.limiter import limiter
from src.core.constants import RATE_LIMIT_DEFAULT
from src.database.mongodb.repositories.brain_repository import (
    get_user_providers,
    update_provider_db,
    get_user_keys,
    create_key_db,
    update_key_db,
    delete_key_db,
    get_playground_messages,
    create_playground_message_db,
    clear_playground_messages_db,
)
from src.core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


# ─── Providers Endpoints ───

@router.get("/providers", response_model=List[Dict])
@limiter.limit(RATE_LIMIT_DEFAULT)
async def list_providers(request: Request, current_user=Depends(get_current_user)):
    """Retrieve all LLM providers configurations for the active user."""
    user_id = str(current_user["_id"])
    return await get_user_providers(user_id)


@router.put("/providers/{provider_id}", response_model=Dict)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def update_provider(request: Request, provider_id: str, updates: Dict, current_user=Depends(get_current_user)):
    """Update active status or endpoint details of a provider."""
    user_id = str(current_user["_id"])
    result = await update_provider_db(user_id, provider_id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Provider not found or updates empty")
    return result


# ─── API Keys Endpoints ───

@router.get("/keys", response_model=List[Dict])
@limiter.limit(RATE_LIMIT_DEFAULT)
async def list_keys(request: Request, current_user=Depends(get_current_user)):
    """Retrieve all registered API keys for the active user."""
    user_id = str(current_user["_id"])
    return await get_user_keys(user_id)


@router.post("/keys", response_model=Dict)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def add_key(request: Request, key_data: Dict, current_user=Depends(get_current_user)):
    """Add a new API key."""
    user_id = str(current_user["_id"])
    return await create_key_db(user_id, key_data)


@router.put("/keys/{key_id}", response_model=Dict)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def update_key(request: Request, key_id: str, updates: Dict, current_user=Depends(get_current_user)):
    """Toggle a key active status or update label."""
    user_id = str(current_user["_id"])
    result = await update_key_db(user_id, key_id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Key not found or updates empty")
    return result


@router.delete("/keys/{key_id}")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def remove_key(request: Request, key_id: str, current_user=Depends(get_current_user)):
    """Delete an API key."""
    user_id = str(current_user["_id"])
    success = await delete_key_db(user_id, key_id)
    if not success:
        raise HTTPException(status_code=404, detail="Key not found or could not be deleted")
    return {"message": "Key deleted successfully"}


# ─── Playground Chat Sandbox Endpoints ───

@router.get("/playground/messages", response_model=List[Dict])
@limiter.limit(RATE_LIMIT_DEFAULT)
async def list_messages(request: Request, current_user=Depends(get_current_user)):
    """Retrieve playground chat history."""
    user_id = str(current_user["_id"])
    return await get_playground_messages(user_id)


@router.post("/playground/messages", response_model=Dict)
@limiter.limit(RATE_LIMIT_DEFAULT)
async def add_message(request: Request, msg_data: Dict, current_user=Depends(get_current_user)):
    """Save user or assistant message to playground history."""
    user_id = str(current_user["_id"])
    return await create_playground_message_db(user_id, msg_data)


@router.delete("/playground/messages")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def clear_messages(request: Request, current_user=Depends(get_current_user)):
    """Clear playground chat history."""
    user_id = str(current_user["_id"])
    await clear_playground_messages_db(user_id)
    return {"message": "Chat history cleared successfully"}


from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from src.services.chat_service import stream_playground_completion

class PlaygroundCompletionRequest(BaseModel):
    provider: str
    model: str
    messages: List[Dict]
    temperature: float = 0.7
    max_tokens: int = 2048
    system_prompt: Optional[str] = None


@router.post("/playground/completion")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def playground_completion(
    request: Request,
    req_data: PlaygroundCompletionRequest,
    current_user=Depends(get_current_user),
):
    """Securely streams completion for playground chat sandbox using custom settings and user credentials."""
    user_id = str(current_user["_id"])
    return StreamingResponse(
        stream_playground_completion(
            provider=req_data.provider,
            model=req_data.model,
            messages=req_data.messages,
            temperature=req_data.temperature,
            max_tokens=req_data.max_tokens,
            system_prompt=req_data.system_prompt,
            user_id=user_id,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/providers/{provider_id}/ping")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def ping_provider(
    request: Request,
    provider_id: str,
    current_user=Depends(get_current_user),
):
    """Real connection ping. Instantiates the LLM and runs a quick probe."""
    import time
    from src.core.llm_factory import get_llm, current_user_keys
    from src.database.mongodb.repositories.brain_repository import get_user_keys
    
    user_id = str(current_user["_id"])
    
    try:
        user_keys_list = await get_user_keys(user_id)
        keys_dict = {k["providerId"]: k["key"] for k in user_keys_list if k.get("isActive")}
        current_user_keys.set(keys_dict)
        
        llm = get_llm(
            provider=provider_id,
            temperature=0.0,
            streaming=False,
        )
        
        if hasattr(llm, "timeout"):
            try:
                llm.timeout = 5.0
            except Exception:
                pass
        
        start_time = time.monotonic()
        await llm.ainvoke("say ping")
        latency_ms = int((time.monotonic() - start_time) * 1000)
        
        return {"status": "connected", "latency": latency_ms}
    except Exception as e:
        logger.error(f"Ping failed for provider {provider_id}: {e}")
        return {"status": "error", "detail": str(e)}


@router.post("/providers/{provider_id}/benchmark")
@limiter.limit(RATE_LIMIT_DEFAULT)
async def benchmark_provider(
    request: Request,
    provider_id: str,
    current_user=Depends(get_current_user),
):
    """Runs a real latency and throughput speed test using a small sample prompt."""
    import time
    from src.core.llm_factory import get_llm, current_user_keys
    from src.database.mongodb.repositories.brain_repository import get_user_keys, update_provider_db
    
    user_id = str(current_user["_id"])
    
    try:
        user_keys_list = await get_user_keys(user_id)
        keys_dict = {k["providerId"]: k["key"] for k in user_keys_list if k.get("isActive")}
        current_user_keys.set(keys_dict)
        
        llm = get_llm(
            provider=provider_id,
            temperature=0.2,
            streaming=True,
        )
        
        prompt = "Write a 3-sentence description of the solar system."
        
        start_time = time.monotonic()
        ttft = None
        token_count = 0
        
        async for chunk in llm.astream(prompt):
            if ttft is None:
                ttft = int((time.monotonic() - start_time) * 1000)
            if hasattr(chunk, "content") and chunk.content:
                txt = chunk.content
                token_count += len(txt.split()) + 1
        
        total_time = time.monotonic() - start_time
        if total_time <= 0:
            total_time = 0.01
            
        tokens_per_sec = int(token_count / total_time)
        latency = ttft if ttft is not None else int(total_time * 1000)
        latency = max(1, latency)
        
        await update_provider_db(user_id, provider_id, {
            "latency": latency,
            "tokensPerSec": tokens_per_sec
        })
        
        return {"latency": latency, "tokensPerSec": tokens_per_sec}
    except Exception as e:
        logger.error(f"Benchmark failed for provider {provider_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Benchmark speed test failed: {str(e)}"
        )
