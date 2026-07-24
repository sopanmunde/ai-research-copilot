"""
src/agents/langgraph/nodes/memory_retrieval_node.py — Memory Retrieval Node
=============================================================================
Retrieves past conversations from Pinecone (filtered by user_id and type="chat_memory")
and user-specific key facts from MongoDB, injecting them into the graph state.
"""
from typing import Dict, Any
from agents.langgraph.state import AgentState
from rag.vectorstores.pinecone_store import get_vector_store
from database.mongodb.repositories.user_memory_repository import get_user_facts
from core.logger import get_logger

logger = get_logger(__name__)


async def memory_retrieval_node(state: AgentState) -> dict:
    """
    Retrieves user facts from MongoDB and semantically retrieves relevant
    past conversation segments from Pinecone, storing them in state["long_term_memory"].
    """
    query = state.get("query", "")
    user_id = state.get("user_id")
    conversation_id = state.get("conversation_id")
    workflow_type = state.get("workflow_type", "research")

    if not user_id:
        logger.info("[Memory Retrieval] No user_id in state — skipping memory retrieval")
        return {
            "long_term_memory": "",
            "current_node": "memory_retriever"
        }

    logger.info(f"[Memory Retrieval] Retrieving long-term memory for user={user_id}")

    # 1. Fetch user facts from MongoDB user_memory
    facts = []
    try:
        facts = await get_user_facts(user_id, limit=10)
    except Exception as e:
        logger.error(f"[Memory Retrieval] Failed to fetch user facts from MongoDB: {e}")

    # 2. Fetch semantically similar past chat segments from Pinecone
    mem_docs = []
    try:
        store = get_vector_store()
        # Query the Pinecone index for past chat messages matching the query
        mem_docs = await store.asimilarity_search(
            query,
            k=4,
            filter={"user_id": user_id, "type": "chat_memory"}
        )
        logger.info(f"[Memory Retrieval] Retrieved {len(mem_docs)} relevant past chat segments from Pinecone")
    except Exception as e:
        logger.error(f"[Memory Retrieval] Failed to retrieve past chat segments from Pinecone: {e}")

    # 3. Format retrieved facts and chat logs
    facts_section = ""
    if facts:
        facts_section = "Key persistent facts about the user & their research:\n" + "\n".join(
            f"- {f['fact']}" for f in facts
        )

    chat_section = ""
    if mem_docs:
        formatted_turns = []
        for i, doc in enumerate(mem_docs, 1):
            # Clean page_content or structure it
            content = doc.page_content.strip()
            # If the snippet is already in User/AI format, append it
            formatted_turns.append(f"Match {i}:\n{content}")
        chat_section = "Relevant past exchanges:\n" + "\n\n".join(formatted_turns)

    # 4. Construct long_term_memory string
    long_term_memory = ""
    parts = []
    if facts_section:
        parts.append(facts_section)
    if chat_section:
        parts.append(chat_section)

    if parts:
        long_term_memory = (
            "=== USER PROFILE & LONG-TERM CONTEXT ===\n"
            + "\n\n".join(parts)
            + "\n========================================"
        )

    logger.info(f"[Memory Retrieval] Context size: {len(long_term_memory)} characters")

    return {
        "long_term_memory": long_term_memory,
        "current_node": "memory_retriever"
    }
