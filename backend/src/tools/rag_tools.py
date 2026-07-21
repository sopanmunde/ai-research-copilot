"""
src/tools/rag_tools.py — Pinecone RAG & MongoDB Query Tools
============================================================
Provides LangChain @tool functions for on-demand knowledge base search
and workspace data queries.

Tools:
  1. search_knowledge_base  — Pinecone MMR semantic search
  2. query_user_workspace   — MongoDB collection queries (tasks, notes, documents)
"""
import asyncio
from typing import Optional
from langchain_core.tools import tool
from src.core.logger import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# 1. search_knowledge_base
# ---------------------------------------------------------------------------

@tool
async def search_knowledge_base(query: str, user_id: str = "", top_k: int = 6) -> str:
    """
    Search the user's personal knowledge base (Pinecone vector store) for relevant information.

    Use this tool when:
    - The user refers to 'my documents', 'my files', or 'what I uploaded'
    - You need to ground your answer in the user's own research materials
    - The user asks a domain-specific question that requires their uploaded context
    - You want to find relevant passages from PDFs, research papers, or notes the user uploaded

    Args:
        query: The semantic search query (a natural language question or phrase).
        user_id: The user's unique identifier for scoped retrieval. Leave empty to search all.
        top_k: Number of top results to return (default: 6, max: 20).

    Returns:
        Formatted string of the most relevant document chunks with source citations.
    """
    top_k = min(top_k, 20)
    logger.info(f"[search_knowledge_base] query='{query[:80]}', user_id={user_id or 'all'}, top_k={top_k}")

    try:
        from src.rag.vectorstores.pinecone_store import get_mmr_retriever
        import hashlib

        filter_dict = {"user_id": user_id} if user_id else None
        retriever = get_mmr_retriever(top_k=top_k, filter=filter_dict)

        try:
            docs = await asyncio.wait_for(retriever.ainvoke(query), timeout=15.0)
        except asyncio.TimeoutError:
            logger.warning("[search_knowledge_base] Pinecone retrieval timed out")
            return "Knowledge base search timed out. Please try again."

        if not docs:
            return f"No relevant documents found in the knowledge base for: '{query}'"

        lines = [f"Knowledge Base Search Results for: '{query}'\n{'='*60}"]
        for i, doc in enumerate(docs, 1):
            meta = doc.metadata or {}
            source = meta.get("filename") or meta.get("source") or "Unknown Source"
            page = meta.get("page", "")
            page_str = f" (Page {page})" if page and page != "N/A" else ""
            chunk = doc.page_content.strip()[:400]
            lines.append(f"\n[{i}] Source: {source}{page_str}\n{chunk}")

        logger.info(f"[search_knowledge_base] Returned {len(docs)} chunks")
        return "\n".join(lines)

    except Exception as e:
        logger.error(f"[search_knowledge_base] Error: {e}")
        return f"Knowledge base search failed: {str(e)[:200]}"


# ---------------------------------------------------------------------------
# 2. query_user_workspace
# ---------------------------------------------------------------------------

@tool
async def query_user_workspace(
    user_id: str,
    collection: str = "tasks",
    limit: int = 20,
    filter_status: Optional[str] = None,
) -> str:
    """
    Query the user's workspace data from MongoDB — tasks, notes, or documents.

    Use this tool when:
    - The user asks about their tasks, to-do list, or project board
    - You need to see existing notes or document metadata for context
    - The user says 'show me my tasks' or 'what documents do I have'
    - You want to ground an answer in the user's actual workspace data

    Args:
        user_id: The user's unique identifier (required).
        collection: Which collection to query. Options:
                    'tasks' — task board items
                    'notes' — user notes
                    'documents' — uploaded document metadata
        limit: Maximum number of records to return (default: 20, max: 100).
        filter_status: Optional status filter for tasks ('todo', 'in-progress', 'done').

    Returns:
        Formatted string listing workspace items with their details.
    """
    if not user_id:
        return "Error: user_id is required to query workspace data."

    limit = min(limit, 100)
    valid_collections = ("tasks", "notes", "documents")
    if collection not in valid_collections:
        return f"Error: Invalid collection '{collection}'. Choose from: {', '.join(valid_collections)}"

    logger.info(f"[query_user_workspace] user={user_id}, collection={collection}, limit={limit}")

    try:
        from src.database.mongodb.connection import get_database
        db = get_database()

        query_filter: dict = {"user_id": user_id}
        if filter_status and collection == "tasks":
            query_filter["status"] = filter_status

        cursor = db[collection].find(query_filter, {"file_bytes": 0}).sort("_id", -1).limit(limit)
        records = await cursor.to_list(limit)

        if not records:
            msg = f"No {collection} found for this user"
            if filter_status:
                msg += f" with status '{filter_status}'"
            return msg

        lines = [f"Workspace {collection.title()} ({len(records)} records)\n{'='*60}"]
        for r in records:
            r["id"] = str(r.pop("_id", ""))
            # Format based on collection type
            if collection == "tasks":
                title = r.get("title", r.get("name", "Untitled Task"))
                status = r.get("status", "unknown")
                priority = r.get("priority", "")
                due = r.get("due_date", "")
                lines.append(f"\n• [{status.upper()}] {title}")
                if priority:
                    lines.append(f"  Priority: {priority}")
                if due:
                    lines.append(f"  Due: {due}")
                desc = r.get("description", "")[:150]
                if desc:
                    lines.append(f"  {desc}")
            elif collection == "notes":
                title = r.get("title", "Untitled Note")
                content = r.get("content", "")[:200]
                created = r.get("created_at", "")
                lines.append(f"\n• {title}")
                if created:
                    lines.append(f"  Created: {created}")
                if content:
                    lines.append(f"  {content}...")
            elif collection == "documents":
                filename = r.get("filename", "Unknown")
                ftype = r.get("file_type", "")
                chunks = r.get("chunk_count", 0)
                uploaded = r.get("uploaded_at", "")
                lines.append(f"\n• {filename} ({ftype}) — {chunks} chunks")
                if uploaded:
                    lines.append(f"  Uploaded: {uploaded}")

        logger.info(f"[query_user_workspace] Returned {len(records)} records from {collection}")
        return "\n".join(lines)

    except Exception as e:
        logger.error(f"[query_user_workspace] Error: {e}")
        return f"Workspace query failed: {str(e)[:200]}"
