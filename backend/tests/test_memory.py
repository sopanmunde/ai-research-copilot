"""
backend/tests/test_memory.py — Unit tests for long-term multi-session memory
============================================================================
Run: pytest tests/test_memory.py -v
"""
import sys
import os
import pytest
from unittest import mock
from langchain_core.documents import Document

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database.mongodb.repositories.user_memory_repository import (
    save_user_fact,
    get_user_facts,
    delete_user_fact,
)
from agents.langgraph.nodes.memory_retrieval_node import memory_retrieval_node
from services.chat_service import extract_and_save_user_facts


class TestUserMemoryRepository:
    """Validate MongoDB CRUD operations for user fact storage."""

    @pytest.mark.asyncio
    @mock.patch("database.mongodb.repositories.user_memory_repository._db")
    async def test_save_user_fact_new(self, mock_db):
        # Mock database calls
        mock_collection = mock.MagicMock()
        mock_collection.find_one = mock.AsyncMock(return_value=None)
        
        mock_insert_result = mock.MagicMock()
        mock_insert_result.inserted_id = "fact_id_123"
        mock_collection.insert_one = mock.AsyncMock(return_value=mock_insert_result)
        
        mock_db_instance = mock.MagicMock()
        mock_db_instance.__getitem__.return_value = mock_collection
        mock_db.return_value = mock_db_instance

        result = await save_user_fact("user_123", "User studies Pfizer trials.")
        
        assert result == "fact_id_123"
        mock_collection.find_one.assert_called_once()
        mock_collection.insert_one.assert_called_once()

    @pytest.mark.asyncio
    @mock.patch("database.mongodb.repositories.user_memory_repository._db")
    async def test_save_user_fact_duplicate(self, mock_db):
        # Mock finding an existing fact
        mock_collection = mock.MagicMock()
        mock_collection.find_one = mock.AsyncMock(return_value={"_id": "existing_id", "fact": "duplicate fact"})
        
        mock_db_instance = mock.MagicMock()
        mock_db_instance.__getitem__.return_value = mock_collection
        mock_db.return_value = mock_db_instance

        result = await save_user_fact("user_123", "duplicate fact")
        
        assert result == "existing_id"
        mock_collection.insert_one.assert_not_called()


class TestMemoryRetrievalNode:
    """Validate that memory_retrieval_node injects context successfully."""

    @pytest.mark.asyncio
    @mock.patch("agents.langgraph.nodes.memory_retrieval_node.get_user_facts")
    @mock.patch("agents.langgraph.nodes.memory_retrieval_node.get_vector_store")
    async def test_memory_retrieval_node_updates_state(self, mock_get_store, mock_get_facts):
        # Mock MongoDB user facts
        mock_get_facts.return_value = [
            {"fact": "User is analyzing cancer research", "id": "1"},
            {"fact": "User prefers concise answers", "id": "2"},
        ]

        # Mock Pinecone conversation matching
        mock_doc = Document(
            page_content="User Query: Side effects of drug X?\nAI Response: Side effects include nausea.",
            metadata={"user_id": "user_abc", "type": "chat_memory"}
        )
        mock_store = mock.MagicMock()
        mock_store.asimilarity_search = mock.AsyncMock(return_value=[mock_doc])
        mock_get_store.return_value = mock_store

        state = {
            "query": "What are side effects of X?",
            "user_id": "user_abc",
            "conversation_id": "conv_1",
            "workflow_type": "research",
        }

        result = await memory_retrieval_node(state)

        assert result["current_node"] == "memory_retriever"
        assert "USER PROFILE & LONG-TERM CONTEXT" in result["long_term_memory"]
        assert "User is analyzing cancer research" in result["long_term_memory"]
        assert "User Query: Side effects of drug X?" in result["long_term_memory"]


@pytest.mark.asyncio
@mock.patch("services.chat_service.get_llm")
@mock.patch("database.mongodb.repositories.user_memory_repository.save_user_fact")
async def test_extract_and_save_user_facts(mock_save_fact, mock_get_llm):
    # Mock LLM fact extraction response
    mock_response = mock.MagicMock()
    mock_response.content = "User is studying Pfizer drug trials.\nUser likes python models."
    
    mock_llm = mock.MagicMock()
    mock_llm.ainvoke = mock.AsyncMock(return_value=mock_response)
    mock_get_llm.return_value = mock_llm

    await extract_and_save_user_facts(
        user_id="user_123",
        query="I am analyzing Pfizer trials for my thesis",
        response="I can help you filter Pfizer clinical data."
    )

    assert mock_save_fact.call_count == 2
    mock_save_fact.assert_any_call("user_123", "User is studying Pfizer drug trials.")
    mock_save_fact.assert_any_call("user_123", "User likes python models.")
