"""
src/api/routes/tools_routes.py — Tool Execution API
====================================================
Exposes REST endpoints so the frontend can:
  1. POST /api/tools/execute        — run Python code in sandbox
  2. POST /api/tools/fetch-url      — fetch a webpage's content
  3. POST /api/tools/search         — run a web search query
  4. GET  /api/tools/github/repo    — get GitHub repo context
  5. POST /api/tools/github/issue   — create a GitHub issue

All endpoints require a valid JWT token (current_user dependency).
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from src.core.security import get_current_user
from src.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/tools", tags=["tools"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class CodeExecuteRequest(BaseModel):
    code: str = Field(..., description="Python code to execute")
    timeout: int = Field(30, ge=1, le=60, description="Execution timeout in seconds")


class CodeExecuteResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int
    success: bool


class FetchUrlRequest(BaseModel):
    url: str = Field(..., description="Full URL to fetch content from")


class FetchUrlResponse(BaseModel):
    url: str
    content: str
    success: bool
    error: Optional[str] = None


class WebSearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    max_results: int = Field(5, ge=1, le=10)


class WebSearchResponse(BaseModel):
    query: str
    results: str
    success: bool


class GitHubRepoRequest(BaseModel):
    owner: str
    repo: str
    include_tree: bool = True


class GitHubIssueRequest(BaseModel):
    owner: str
    repo: str
    title: str
    body: str
    labels: str = ""


# ---------------------------------------------------------------------------
# 1. POST /api/tools/execute — Python code execution
# ---------------------------------------------------------------------------

@router.post("/execute", response_model=CodeExecuteResponse)
async def execute_code(
    request: CodeExecuteRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Execute Python code in a secure sandboxed subprocess.
    Returns stdout, stderr, exit_code, and execution_time_ms.
    """
    import asyncio
    import sys
    import tempfile
    import os

    from src.tools.code_tools import _is_safe_code

    logger.info(
        f"[tools/execute] user={current_user.get('user_id')}, "
        f"code_len={len(request.code)}, timeout={request.timeout}"
    )

    is_safe, reason = _is_safe_code(request.code)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Blocked: {reason}")

    code_to_run = request.code
    timeout = request.timeout

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(code_to_run)
        tmp_path = tmp.name

    stdout_output = ""
    stderr_output = ""
    exit_code = -1
    start = asyncio.get_event_loop().time()

    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env={"PYTHONPATH": "", "HOME": tempfile.gettempdir()},
        )
        try:
            raw_out, raw_err = await asyncio.wait_for(proc.communicate(), timeout=float(timeout))
            stdout_output = raw_out.decode("utf-8", errors="replace").strip()
            stderr_output = raw_err.decode("utf-8", errors="replace").strip()
            exit_code = proc.returncode or 0
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            stderr_output = f"TimeoutError: Execution exceeded {timeout}s"
            exit_code = -1
    except Exception as e:
        stderr_output = str(e)
        exit_code = -1
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    elapsed_ms = int((asyncio.get_event_loop().time() - start) * 1000)

    return CodeExecuteResponse(
        stdout=stdout_output,
        stderr=stderr_output,
        exit_code=exit_code,
        execution_time_ms=elapsed_ms,
        success=(exit_code == 0),
    )


# ---------------------------------------------------------------------------
# 2. POST /api/tools/fetch-url — webpage content fetcher
# ---------------------------------------------------------------------------

@router.post("/fetch-url", response_model=FetchUrlResponse)
async def fetch_url(
    request: FetchUrlRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Fetch the readable markdown content of a webpage via Jina Reader or Firecrawl.
    """
    from src.tools.web_tools import fetch_webpage_content

    logger.info(f"[tools/fetch-url] user={current_user.get('user_id')}, url={request.url[:80]}")

    if not request.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid URL — must start with http:// or https://")

    try:
        content = await fetch_webpage_content.ainvoke({"url": request.url})
        return FetchUrlResponse(
            url=request.url,
            content=content,
            success=not content.startswith("Failed to fetch"),
        )
    except Exception as e:
        logger.error(f"[tools/fetch-url] Error: {e}")
        return FetchUrlResponse(url=request.url, content="", success=False, error=str(e)[:200])


# ---------------------------------------------------------------------------
# 3. POST /api/tools/search — live web search
# ---------------------------------------------------------------------------

@router.post("/search", response_model=WebSearchResponse)
async def web_search_endpoint(
    request: WebSearchRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Run a live web search via Tavily, SerpAPI, or Brave Search.
    Returns formatted results with titles, URLs, and snippets.
    """
    from src.tools.web_tools import web_search

    logger.info(f"[tools/search] user={current_user.get('user_id')}, query='{request.query[:60]}'")

    try:
        results = await web_search.ainvoke({"query": request.query, "max_results": request.max_results})
        return WebSearchResponse(query=request.query, results=results, success=True)
    except Exception as e:
        logger.error(f"[tools/search] Error: {e}")
        return WebSearchResponse(query=request.query, results="", success=False)


# ---------------------------------------------------------------------------
# 4. POST /api/tools/github/repo — GitHub repo context
# ---------------------------------------------------------------------------

@router.post("/github/repo")
async def github_repo_context(
    request: GitHubRepoRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Fetch high-level context about a GitHub repository (README, file tree, recent commits).
    """
    from src.tools.github_tools import get_repo_context

    logger.info(f"[tools/github/repo] {request.owner}/{request.repo}")

    try:
        result = await get_repo_context.ainvoke({
            "owner": request.owner,
            "repo": request.repo,
            "include_tree": request.include_tree,
        })
        return {"owner": request.owner, "repo": request.repo, "context": result, "success": True}
    except Exception as e:
        logger.error(f"[tools/github/repo] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e)[:200])


# ---------------------------------------------------------------------------
# 5. POST /api/tools/github/issue — create GitHub issue
# ---------------------------------------------------------------------------

@router.post("/github/issue")
async def create_issue(
    request: GitHubIssueRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new GitHub issue in the specified repository.
    """
    from src.tools.github_tools import create_github_issue

    logger.info(f"[tools/github/issue] {request.owner}/{request.repo}: '{request.title[:60]}'")

    try:
        result = await create_github_issue.ainvoke({
            "owner": request.owner,
            "repo": request.repo,
            "title": request.title,
            "body": request.body,
            "labels": request.labels,
        })
        success = result.startswith("✅")
        return {"message": result, "success": success}
    except Exception as e:
        logger.error(f"[tools/github/issue] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e)[:200])
