"""
backend/tests/conftest.py — pytest configuration and shared fixtures
"""
import pytest



@pytest.fixture
def sample_document_metadata():
    return {
        "user_id": "test_user_123",
        "filename": "sample_research_paper.pdf",
        "file_type": "pdf",
        "chunk_count": 42,
    }


@pytest.fixture
def sample_citations():
    return [
        {
            "index": 1,
            "rank": 1,
            "doc_id": "abc123def456",
            "source": "research_paper.pdf",
            "filename": "research_paper.pdf",
            "page": 3,
            "chunk_index": 5,
            "total_chunks": 42,
            "snippet": "The study found that LangGraph enables complex multi-agent orchestration.",
            "confidence": 0.95,
            "uploaded_at": "2024-01-15T10:30:00",
        },
        {
            "index": 2,
            "rank": 2,
            "doc_id": "xyz789ghi012",
            "source": "technical_report.pdf",
            "filename": "technical_report.pdf",
            "page": 7,
            "chunk_index": 12,
            "total_chunks": 85,
            "snippet": "Pinecone's MMR retrieval significantly reduces redundancy in search results.",
            "confidence": 0.90,
            "uploaded_at": "2024-01-20T14:00:00",
        },
    ]


@pytest.fixture
def sample_agent_state():
    return {
        "query": "What are the key benefits of using LangGraph for AI workflows?",
        "conversation_id": None,
        "user_id": "test_user_123",
        "report_mode": False,
        "mode": "agent",
        "workflow_type": "research",
        "selected_llm_provider": "",
        "selected_llm_model": "",
        "requires_context": True,
        "history": [],
        "messages": [],
        "plan": [],
        "retrieved_docs": [],
        "citations": [],
        "summary": "",
        "final_output": "",
        "generated_code": "",
        "code_review": "",
        "test_results": "",
        "analysis_results": "",
        "visualization_data": {},
        "errors": [],
        "current_node": "",
    }
