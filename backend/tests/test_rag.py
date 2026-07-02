"""
backend/tests/test_rag.py — RAG pipeline + agent node unit tests
================================================================
Run: pytest tests/ -v  (from backend/ directory)

Coverage:
  - text cleaning utilities
  - chunking (recursive + semantic)
  - citation node logic
  - report node output assembly
  - health endpoint response shape
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))



class TestChunking:
    """Validate the recursive and semantic chunking strategies."""

    def test_recursive_chunk_returns_list(self):
        from src.rag.ingestion.chunking import recursive_chunk
        from langchain_core.documents import Document

        docs = [Document(page_content="This is a test document. " * 100)]
        chunks = recursive_chunk(docs, chunk_size=200, chunk_overlap=20)
        assert isinstance(chunks, list)
        assert len(chunks) > 1, "Large document should produce multiple chunks"

    def test_semantic_chunk_returns_list(self):
        from src.rag.ingestion.chunking import semantic_chunk
        from langchain_core.documents import Document

        docs = [Document(page_content="Paragraph one.\n\nParagraph two.\n\nParagraph three. " * 30)]
        chunks = semantic_chunk(docs, chunk_size=200, chunk_overlap=20)
        assert isinstance(chunks, list)
        assert len(chunks) > 0

    def test_chunk_metadata_preserved(self):
        from src.rag.ingestion.chunking import recursive_chunk
        from langchain_core.documents import Document

        meta = {"filename": "test.pdf", "source": "test.pdf", "user_id": "user_123"}
        docs = [Document(page_content="Content " * 200, metadata=meta.copy())]
        chunks = recursive_chunk(docs, chunk_size=300, chunk_overlap=50)
        for chunk in chunks:
            assert chunk.metadata.get("filename") == "test.pdf"



class TestTextCleaning:
    """Validate the text cleaning pipeline."""

    def test_clean_text_removes_null_bytes(self):
        from src.rag.ingestion.embedding_pipeline import clean_text
        dirty = "Hello\x00World\x01Test"
        result = clean_text(dirty)
        assert "\x00" not in result
        assert "\x01" not in result

    def test_clean_text_normalizes_blank_lines(self):
        from src.rag.ingestion.embedding_pipeline import clean_text
        text = "Line one\n\n\n\n\nLine two"
        result = clean_text(text)
        assert "\n\n\n" not in result

    def test_clean_documents_drops_short(self):
        from src.rag.ingestion.embedding_pipeline import clean_documents
        from langchain_core.documents import Document
        docs = [
            Document(page_content="Short"),
            Document(page_content="This is a substantial content piece. " * 5),
        ]
        result = clean_documents(docs)
        assert len(result) == 1



class TestCitationNode:
    """Validate citation deduplication and confidence scoring."""

    def test_citation_node_deduplicates(self):
        from src.agents.langgraph.nodes.citation_node import citation_node

        citations = [
            {"doc_id": "abc123", "source": "paper.pdf", "page": 1, "snippet": "..."},
            {"doc_id": "abc123", "source": "paper.pdf", "page": 1, "snippet": "..."},  # duplicate
            {"doc_id": "def456", "source": "other.pdf", "page": 2, "snippet": "..."},
        ]
        state = {"citations": citations, "retrieved_docs": [], "current_node": ""}
        result = citation_node(state)
        assert len(result["citations"]) == 2, "Duplicate doc_id should be removed"

    def test_citation_confidence_decays(self):
        from src.agents.langgraph.nodes.citation_node import citation_node

        citations = [
            {"doc_id": f"id{i}", "source": f"doc{i}.pdf", "page": i, "snippet": f"snippet{i}"}
            for i in range(5)
        ]
        state = {"citations": citations, "retrieved_docs": [], "current_node": ""}
        result = citation_node(state)
        confs = [c["confidence"] for c in result["citations"]]
        assert confs == sorted(confs, reverse=True), "Confidence should decay with rank"



class TestReportNode:
    """Validate final output assembly."""

    def test_report_node_includes_summary(self):
        from src.agents.langgraph.nodes.report_node import report_node

        state = {
            "summary": "## Analysis\n\nThis is the synthesized answer.",
            "citations": [],
            "report_mode": False,
            "current_node": "",
        }
        result = report_node(state)
        assert "Analysis" in result["final_output"]

    def test_report_node_appends_references(self):
        from src.agents.langgraph.nodes.report_node import report_node

        state = {
            "summary": "Summary text.",
            "citations": [
                {
                    "rank": 1, "filename": "paper.pdf",
                    "page": 3, "confidence": 0.95,
                    "snippet": "Key insight from document.",
                    "uploaded_at": "",
                }
            ],
            "report_mode": False,
            "current_node": "",
        }
        result = report_node(state)
        assert "📚 References" in result["final_output"]
        assert "paper.pdf" in result["final_output"]

    def test_report_mode_adds_methodology(self):
        from src.agents.langgraph.nodes.report_node import report_node

        state = {
            "summary": "Summary.",
            "citations": [
                {"rank": 1, "filename": "doc.pdf", "page": 1,
                 "confidence": 0.9, "snippet": "...", "uploaded_at": ""}
            ],
            "report_mode": True,
            "current_node": "",
        }
        result = report_node(state)
        assert "semantic MMR retrieval" in result["final_output"]



class TestWorkflowRegistry:
    """Validate the workflow metadata registry."""

    def test_workflow_info_structure(self):
        from src.workflows.research_workflow import get_workflow_info

        info = get_workflow_info("research")
        assert "type" in info
        assert "definition" in info
        assert "nodes" in info
        assert "edges" in info
        assert info["type"] == "research"
        assert info["definition"]["nodes"][0] == "planner"

    def test_node_names_order(self):
        from src.workflows.research_workflow import get_node_names

        names = get_node_names("research")
        assert names[0] == "planner"
        assert "retriever" in names
        assert "summarizer" in names
        assert names[-1] == "reporter"

    def test_coding_workflow_nodes(self):
        from src.workflows.research_workflow import get_node_names

        names = get_node_names("coding")
        assert names[0] == "planner"
        assert "code_generation" in names
        assert "code_review" in names
        assert "testing" in names
        assert names[-1] == "reporter"

    def test_data_analysis_workflow_nodes(self):
        from src.workflows.research_workflow import get_node_names

        names = get_node_names("data_analysis")
        assert names[0] == "planner"
        assert "data_analysis" in names
        assert names[-1] == "reporter"

    def test_all_workflows_includes_new_types(self):
        from src.workflows.research_workflow import get_all_workflows

        workflows = get_all_workflows()
        assert "research" in workflows
        assert "coding" in workflows
        assert "data_analysis" in workflows
        assert "summary" in workflows
        assert "technical" in workflows
        assert "competitive" in workflows
