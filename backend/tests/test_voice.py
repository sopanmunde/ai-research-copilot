"""
backend/tests/test_voice.py — Unit tests for the Voice features (STT, TTS, Preprocessing node)
=============================================================================================
Run: pytest backend/tests/test_voice.py -v
"""
import sys
import os
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import UploadFile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.agents.langgraph.nodes.voice_preprocessing_node import voice_preprocessing_node
from src.api.routes.audio_routes import transcribe, text_to_speech


@pytest.mark.asyncio
async def test_voice_preprocessor_skips_when_is_voice_false(sample_agent_state):
    state = sample_agent_state.copy()
    state["is_voice"] = False
    state["query"] = "uh hello there"
    
    result = await voice_preprocessing_node(state)
    assert result.get("current_node") == "voice_preprocessor"
    assert "query" not in result or result["query"] == "uh hello there"


@pytest.mark.asyncio
async def test_voice_preprocessor_cleans_query_when_is_voice_true(sample_agent_state):
    state = sample_agent_state.copy()
    state["is_voice"] = True
    state["query"] = "um write a python function please"
    
    # Mock LLM response
    mock_response = MagicMock()
    mock_response.content = "Write a python function."
    
    with patch("src.agents.langgraph.nodes.voice_preprocessing_node.get_llm") as mock_get_llm:
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)
        mock_get_llm.return_value = mock_llm
        
        result = await voice_preprocessing_node(state)
        
        assert result.get("current_node") == "voice_preprocessor"
        assert result.get("query") == "Write a python function."


@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_api_transcribe_google_llm(mock_post):
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test_audio.webm"
    mock_file.content_type = "audio/webm"
    mock_file.read = AsyncMock(return_value=b"audio bytes")
    
    # Mock Gemini response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": "Hello world transcription"
                        }
                    ]
                }
            }
        ]
    }
    mock_post.return_value = mock_response
    
    with patch("src.api.routes.audio_routes.settings") as mock_settings:
        mock_settings.GOOGLE_API_KEY = "mock_google_key"
        
        res = await transcribe(file=mock_file, current_user={"_id": "user123"})
        
        assert res == {"text": "Hello world transcription"}
        assert mock_post.called


@pytest.mark.asyncio
async def test_api_tts_fails_when_no_google_key():
    with patch("src.api.routes.audio_routes.settings") as mock_settings:
        mock_settings.GOOGLE_API_KEY = ""
        
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            await text_to_speech(text="test text", current_user={"_id": "user123"})
        
        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == "google_tts_disabled"


@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_api_tts_returns_audio_when_key_present(mock_post):
    import base64
    
    # Mock Google Cloud TTS response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "audioContent": base64.b64encode(b"google synthesized audio").decode("utf-8")
    }
    mock_post.return_value = mock_response
    
    with patch("src.api.routes.audio_routes.settings") as mock_settings:
        mock_settings.GOOGLE_API_KEY = "mock_google_key"
        
        response = await text_to_speech(text="test text", current_user={"_id": "user123"})
        
        assert response.media_type == "audio/mpeg"
        
        # Consume the streaming response generator
        chunks = []
        async for chunk in response.body_iterator:
            chunks.append(chunk)
            
        full_content = b"".join(chunks)
        assert full_content == b"google synthesized audio"
        assert mock_post.called
