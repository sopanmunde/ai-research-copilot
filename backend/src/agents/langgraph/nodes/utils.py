"""
src/agents/langgraph/nodes/utils.py — Shared node utilities
============================================================
Helpers shared across all LangGraph agent nodes.
"""
import json
from typing import Any


def extract_text(content: Any) -> str:
    """
    Safely extract a plain-text string from an LLM response's `.content`.

    Some providers (notably Google Gemini via langchain-google-genai)
    occasionally return the content as:
      - A Python list of dicts:  [{"type": "text", "text": "..."}]
      - A JSON-serialized version of the same list

    This helper normalises all variants into a clean string.

    Args:
        content: The raw `response.content` value from any LangChain model.

    Returns:
        A plain-text string ready for markdown rendering.
    """
    if content is None:
        return ""

    if isinstance(content, str):
        stripped = content.strip()
        if stripped.startswith("[") and '"text"' in stripped:
            try:
                parsed = json.loads(stripped)
                if isinstance(parsed, list):
                    return _join_blocks(parsed)
            except (json.JSONDecodeError, TypeError, KeyError):
                pass
        return content

    if isinstance(content, list):
        return _join_blocks(content)

    return str(content)


def _join_blocks(blocks: list) -> str:
    """Join a list of content block dicts into a single string."""
    parts = []
    for block in blocks:
        if isinstance(block, dict):
            parts.append(block.get("text", ""))
        elif isinstance(block, str):
            parts.append(block)
        else:
            parts.append(str(block))
    return "".join(parts)
