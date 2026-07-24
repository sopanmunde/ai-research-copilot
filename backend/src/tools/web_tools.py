"""
src/tools/web_tools.py — Web Search & Scraper Tools
=====================================================
Provides LangChain @tool functions for:
  1. web_search        — queries live web via Tavily/SerpAPI/Brave (user-key aware)
  2. fetch_webpage_content — fetches full markdown content from a URL via Jina Reader or Firecrawl
"""
import httpx
from datetime import datetime
from typing import Optional
from langchain_core.tools import tool
from core.config import settings
from core.logger import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# 1. web_search
# ---------------------------------------------------------------------------

@tool
async def web_search(query: str, max_results: int = 5) -> str:
    """
    Search the live web for up-to-date information on any topic.

    Use this tool when:
    - The user asks about current events, news, or recent data
    - You need factual information that may not be in the knowledge base
    - The query requires real-time data (prices, stats, company info, etc.)

    Args:
        query: The search query string to look up on the web.
        max_results: Maximum number of results to return (default: 5, max: 10).

    Returns:
        Formatted string of search results with titles, URLs, and snippets.
    """
    max_results = min(max_results, 10)
    logger.info(f"[web_search] query='{query[:80]}', max_results={max_results}")

    # Resolve API keys from settings
    tavily_key = getattr(settings, "TAVILY_API_KEY", "")
    serpapi_key = getattr(settings, "SERPAPI_API_KEY", "")
    brave_key = getattr(settings, "BRAVE_API_KEY", "")

    results = []

    if tavily_key:
        results = await _search_tavily(query, tavily_key, max_results)
    elif serpapi_key:
        results = await _search_serpapi(query, serpapi_key, max_results)
    elif brave_key:
        results = await _search_brave(query, brave_key, max_results)

    if not results:
        logger.warning("[web_search] No search API configured or no results returned")
        return f"No web search results found for: {query}\n(Tip: Configure TAVILY_API_KEY, SERPAPI_API_KEY, or BRAVE_API_KEY in your .env)"

    # Format output
    lines = [f"Web Search Results for: '{query}'\n{'='*60}"]
    for i, r in enumerate(results, 1):
        title = r.get("title", "Untitled")
        url = r.get("url", "")
        snippet = r.get("content", "")[:300]
        lines.append(f"\n[{i}] {title}\nURL: {url}\nSummary: {snippet}")

    logger.info(f"[web_search] Returning {len(results)} results")
    return "\n".join(lines)


async def _search_tavily(query: str, api_key: str, max_results: int) -> list:
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query": query,
        "search_depth": "smart",
        "include_answer": False,
        "max_results": max_results,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                return res.json().get("results", [])
            logger.warning(f"[web_search] Tavily error {res.status_code}")
        except Exception as e:
            logger.warning(f"[web_search] Tavily exception: {e}")
    return []


async def _search_serpapi(query: str, api_key: str, max_results: int) -> list:
    url = "https://serpapi.com/search"
    params = {"q": query, "api_key": api_key, "engine": "google", "num": max_results}
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.get(url, params=params)
            if res.status_code == 200:
                items = res.json().get("organic_results", [])
                return [{"title": i.get("title", ""), "url": i.get("link", ""), "content": i.get("snippet", "")} for i in items]
            logger.warning(f"[web_search] SerpAPI error {res.status_code}")
        except Exception as e:
            logger.warning(f"[web_search] SerpAPI exception: {e}")
    return []


async def _search_brave(query: str, api_key: str, max_results: int) -> list:
    url = "https://api.search.brave.com/res/v1/web/search"
    headers = {"Accept": "application/json", "X-Subscription-Token": api_key}
    params = {"q": query, "count": max_results}
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.get(url, headers=headers, params=params)
            if res.status_code == 200:
                items = res.json().get("web", {}).get("results", [])
                return [{"title": i.get("title", ""), "url": i.get("url", ""), "content": i.get("description", "")} for i in items]
            logger.warning(f"[web_search] Brave error {res.status_code}")
        except Exception as e:
            logger.warning(f"[web_search] Brave exception: {e}")
    return []


# ---------------------------------------------------------------------------
# 2. fetch_webpage_content
# ---------------------------------------------------------------------------

@tool
async def fetch_webpage_content(url: str) -> str:
    """
    Fetch the full readable text content of a webpage as clean markdown.

    Use this tool when:
    - A web search returned a URL that seems highly relevant
    - You need the complete article, documentation page, or blog post content
    - You want to deeply analyze a specific webpage beyond a search snippet

    Args:
        url: The full URL of the webpage to fetch (must start with http:// or https://).

    Returns:
        The webpage content converted to clean markdown text (up to 8000 characters).
    """
    if not url.startswith(("http://", "https://")):
        return f"Error: Invalid URL '{url}'. Must start with http:// or https://"

    logger.info(f"[fetch_webpage_content] Fetching: {url}")

    # 1. Try Firecrawl if API key is configured
    firecrawl_key = getattr(settings, "FIRECRAWL_API_KEY", "")
    if firecrawl_key:
        content = await _fetch_via_firecrawl(url, firecrawl_key)
        if content:
            return _truncate(content, 8000)

    # 2. Fallback: Jina Reader (free, no key required)
    content = await _fetch_via_jina(url)
    if content:
        return _truncate(content, 8000)

    # 3. Last resort: raw httpx fetch
    content = await _fetch_raw(url)
    if content:
        return _truncate(content, 8000)

    return f"Failed to fetch content from: {url}"


async def _fetch_via_firecrawl(url: str, api_key: str) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"url": url, "formats": ["markdown"]},
            )
            if res.status_code == 200:
                data = res.json()
                return data.get("data", {}).get("markdown", "")
    except Exception as e:
        logger.warning(f"[fetch_webpage_content] Firecrawl error: {e}")
    return None


async def _fetch_via_jina(url: str) -> Optional[str]:
    """Uses Jina Reader API — free, no key required."""
    jina_url = f"https://r.jina.ai/{url}"
    headers = {"Accept": "text/plain"}
    jina_key = getattr(settings, "JINA_API_KEY", "")
    if jina_key:
        headers["Authorization"] = f"Bearer {jina_key}"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.get(jina_url, headers=headers, follow_redirects=True)
            if res.status_code == 200:
                return res.text
    except Exception as e:
        logger.warning(f"[fetch_webpage_content] Jina error: {e}")
    return None


async def _fetch_raw(url: str) -> Optional[str]:
    """Raw HTTP fallback — returns plain HTML stripped to text."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(url, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})
            if res.status_code == 200:
                # Very basic HTML-to-text: strip tags
                import re
                text = re.sub(r"<[^>]+>", " ", res.text)
                text = re.sub(r"\s+", " ", text).strip()
                return text
    except Exception as e:
        logger.warning(f"[fetch_webpage_content] Raw fetch error: {e}")
    return None


def _truncate(content: str, max_chars: int) -> str:
    if len(content) > max_chars:
        return content[:max_chars] + f"\n\n[Content truncated at {max_chars} chars]"
    return content
