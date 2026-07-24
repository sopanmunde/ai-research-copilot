"""
backend/tests/test_vision.py — Unit tests for the vision extraction pipeline
=============================================================================
Run: pytest tests/test_vision.py -v
"""
import sys
import os
import pytest
from unittest import mock
from langchain_core.documents import Document

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agents.langgraph.nodes.vision_extraction_node import (
    encode_image_base64,
    extract_vision_data,
    extract_scanned_pdf,
    vision_extraction_node,
)


def test_base64_encoding():
    content = b"hello world"
    encoded = encode_image_base64(content)
    assert encoded == "aGVsbG8gd29ybGQ="


@pytest.mark.asyncio
@mock.patch("agents.langgraph.nodes.vision_extraction_node.get_fallback_providers")
@mock.patch("agents.langgraph.nodes.vision_extraction_node.get_llm")
async def test_extract_vision_data_success(mock_get_llm, mock_get_providers):
    # Mock LLM and fallback list
    mock_get_providers.return_value = ["google"]
    mock_response = mock.MagicMock()
    mock_response.content = "Extracted chart data JSON"
    
    mock_llm_instance = mock.MagicMock()
    mock_llm_instance.ainvoke = mock.AsyncMock(return_value=mock_response)
    mock_get_llm.return_value = mock_llm_instance

    result = await extract_vision_data(
        content=b"fakeimagebytes",
        filename="chart.png",
        file_type="png",
        extraction_type="chart",
        provider="google",
        model_name="gemini-2.5-flash"
    )

    assert result == "Extracted chart data JSON"
    mock_get_llm.assert_called_once_with(
        provider="google",
        model_name="gemini-2.5-flash",
        temperature=0.1,
        streaming=False
    )


@pytest.mark.asyncio
@mock.patch("agents.langgraph.nodes.vision_extraction_node.get_fallback_providers")
@mock.patch("agents.langgraph.nodes.vision_extraction_node.get_llm")
async def test_extract_vision_data_failover(mock_get_llm, mock_get_providers):
    # Test fallback: google fails, openai succeeds
    mock_get_providers.return_value = ["google", "openai"]
    
    # First provider fails, second succeeds
    mock_google_llm = mock.MagicMock()
    mock_google_llm.ainvoke = mock.AsyncMock(side_effect=Exception("Google API Error"))
    
    mock_openai_response = mock.MagicMock()
    mock_openai_response.content = "OCR of scanned table"
    mock_openai_llm = mock.MagicMock()
    mock_openai_llm.ainvoke = mock.AsyncMock(return_value=mock_openai_response)
    
    def side_effect(provider, *args, **kwargs):
        if provider == "google":
            return mock_google_llm
        elif provider == "openai":
            return mock_openai_llm
        raise ValueError("Invalid provider")

    mock_get_llm.side_effect = side_effect

    result = await extract_vision_data(
        content=b"faketablebytes",
        filename="table.jpg",
        file_type="jpg",
        extraction_type="table"
    )

    assert result == "OCR of scanned table"
    assert mock_get_llm.call_count == 2


@pytest.mark.asyncio
@mock.patch("agents.langgraph.nodes.vision_extraction_node.get_llm")
async def test_extract_scanned_pdf_gemini_direct(mock_get_llm):
    # Mock LLM response for native PDF input
    mock_response = mock.MagicMock()
    mock_response.content = "Native Gemini PDF OCR result"
    mock_llm_instance = mock.MagicMock()
    mock_llm_instance.ainvoke = mock.AsyncMock(return_value=mock_response)
    mock_get_llm.return_value = mock_llm_instance

    docs = await extract_scanned_pdf(
        pdf_bytes=b"fakepdfbytes",
        filename="scanned.pdf",
        provider="google"
    )

    assert len(docs) == 1
    assert docs[0].page_content == "Native Gemini PDF OCR result"
    assert docs[0].metadata["extracted_via"] == "gemini_direct_pdf"
    assert docs[0].metadata["is_scanned"] is True
    mock_get_llm.assert_called_once()


@pytest.mark.asyncio
@mock.patch("agents.langgraph.nodes.vision_extraction_node.extract_vision_data")
async def test_extract_scanned_pdf_fallback_rendering(mock_extract_vision_data):
    # Mock PyMuPDF objects
    mock_fitz = mock.MagicMock()
    mock_page = mock.MagicMock()
    mock_pix = mock.MagicMock()
    mock_pix.tobytes.return_value = b"renderedpagebytes"
    mock_page.get_pixmap.return_value = mock_pix
    
    mock_pdf_doc = mock.MagicMock()
    mock_pdf_doc.__len__.return_value = 2
    mock_pdf_doc.load_page.return_value = mock_page
    mock_fitz.open.return_value = mock_pdf_doc

    mock_extract_vision_data.return_value = "Extracted Page Content"

    # Use a non-Google provider to force page-by-page rendering fallback
    with mock.patch.dict("sys.modules", {"fitz": mock_fitz}):
        docs = await extract_scanned_pdf(
            pdf_bytes=b"fakepdfbytes",
            filename="scanned.pdf",
            provider="openai"
        )

    assert len(docs) == 2
    assert docs[0].page_content == "Extracted Page Content"
    assert docs[0].metadata["page"] == 0
    assert docs[0].metadata["is_scanned"] is True
    assert mock_extract_vision_data.call_count == 2


@pytest.mark.asyncio
@mock.patch("agents.langgraph.nodes.vision_extraction_node.get_database")
@mock.patch("agents.langgraph.nodes.vision_extraction_node.extract_vision_data")
async def test_vision_extraction_node_image(mock_extract_vision, mock_get_db):
    # Mock MongoDB
    mock_collection = mock.MagicMock()
    mock_collection.find_one = mock.AsyncMock(return_value={
        "filename": "chart.png",
        "file_bytes": b"fakebytes",
        "file_type": "png"
    })
    mock_db = mock.MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    mock_get_db.return_value = mock_db

    mock_extract_vision.return_value = "Visual chart json analysis"

    state = {
        "filename": "chart.png",
        "user_id": "user_abc",
        "query": "Show me chart data",
        "selected_llm_provider": "google",
        "selected_llm_model": "gemini-2.5-flash",
        "errors": []
    }

    result = await vision_extraction_node(state)

    assert result["current_node"] == "vision_extractor"
    assert result["analysis_results"] == "Visual chart json analysis"
    mock_extract_vision.assert_called_once_with(
        content=b"fakebytes",
        filename="chart.png",
        file_type="png",
        extraction_type="chart",
        provider="google",
        model_name="gemini-2.5-flash"
    )
