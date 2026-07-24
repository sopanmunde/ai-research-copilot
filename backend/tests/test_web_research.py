"""
backend/tests/test_web_research.py — Unit tests for the Web Research Node
==========================================================================
Run: pytest backend/tests/test_web_research.py -v
"""
import sys
import os
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agents.langgraph.nodes.web_research_node import web_research_node


@pytest.mark.asyncio
async def test_web_research_skips_when_requires_context_false(sample_agent_state):
    state = sample_agent_state.copy()
    state["requires_context"] = False
    
    result = await web_research_node(state)
    assert result.get("current_node") == "web_researcher"
    assert "retrieved_docs" not in result
    assert "citations" not in result


@pytest.mark.asyncio
async def test_web_research_skips_when_no_keys_configured(sample_agent_state):
    state = sample_agent_state.copy()
    state["requires_context"] = True
    
    with patch("agents.langgraph.nodes.web_research_node.settings") as mock_settings, \
         patch("agents.langgraph.nodes.web_research_node.current_user_keys") as mock_user_keys:
        mock_settings.TAVILY_API_KEY = ""
        mock_settings.SERPAPI_API_KEY = ""
        mock_settings.BRAVE_API_KEY = ""
        mock_user_keys.get.return_value = {}
        
        result = await web_research_node(state)
        assert result.get("current_node") == "web_researcher"
        assert "retrieved_docs" not in result


@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_web_research_tavily_integration(mock_post, sample_agent_state):
    state = sample_agent_state.copy()
    state["requires_context"] = True
    state["plan"] = ["test query"]
    
    # Mock Tavily response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [
            {
                "title": "Tavily Title",
                "url": "https://tavily.com/result",
                "content": "This is Tavily search result content."
            }
        ]
    }
    mock_post.return_value = mock_response
    
    with patch("agents.langgraph.nodes.web_research_node.settings") as mock_settings, \
         patch("agents.langgraph.nodes.web_research_node.current_user_keys") as mock_user_keys:
        mock_settings.TAVILY_API_KEY = "tavily_mock_key"
        mock_settings.SERPAPI_API_KEY = ""
        mock_settings.BRAVE_API_KEY = ""
        mock_user_keys.get.return_value = {}
        
        result = await web_research_node(state)
        
        assert result.get("current_node") == "web_researcher"
        docs = result.get("retrieved_docs", [])
        cits = result.get("citations", [])
        
        assert len(docs) == 1
        assert docs[0]["metadata"]["source"] == "Tavily Title"
        assert docs[0]["metadata"]["url"] == "https://tavily.com/result"
        assert docs[0]["page_content"] == "This is Tavily search result content."
        
        assert len(cits) == 1
        assert cits[0]["url"] == "https://tavily.com/result"
        assert cits[0]["source"] == "Tavily Title"


@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_web_research_serpapi_integration(mock_get, sample_agent_state):
    state = sample_agent_state.copy()
    state["requires_context"] = True
    state["plan"] = ["serp query"]
    
    # Mock SerpAPI response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "organic_results": [
            {
                "title": "SerpAPI Title",
                "link": "https://serpapi.com/result",
                "snippet": "This is SerpAPI search snippet."
            }
        ]
    }
    mock_get.return_value = mock_response
    
    with patch("agents.langgraph.nodes.web_research_node.settings") as mock_settings, \
         patch("agents.langgraph.nodes.web_research_node.current_user_keys") as mock_user_keys:
        mock_settings.TAVILY_API_KEY = ""
        mock_settings.SERPAPI_API_KEY = "serp_mock_key"
        mock_settings.BRAVE_API_KEY = ""
        mock_user_keys.get.return_value = {}
        
        result = await web_research_node(state)
        
        assert result.get("current_node") == "web_researcher"
        docs = result.get("retrieved_docs", [])
        cits = result.get("citations", [])
        
        assert len(docs) == 1
        assert docs[0]["metadata"]["source"] == "SerpAPI Title"
        assert docs[0]["metadata"]["url"] == "https://serpapi.com/result"
        
        assert len(cits) == 1
        assert cits[0]["url"] == "https://serpapi.com/result"
        assert cits[0]["snippet"] == "This is SerpAPI search snippet."


@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_web_research_brave_integration(mock_get, sample_agent_state):
    state = sample_agent_state.copy()
    state["requires_context"] = True
    state["plan"] = ["brave query"]
    
    # Mock Brave response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "web": {
            "results": [
                {
                    "title": "Brave Title",
                    "url": "https://brave.com/result",
                    "description": "This is Brave description."
                }
            ]
        }
    }
    mock_get.return_value = mock_response
    
    with patch("agents.langgraph.nodes.web_research_node.settings") as mock_settings, \
         patch("agents.langgraph.nodes.web_research_node.current_user_keys") as mock_user_keys:
        mock_settings.TAVILY_API_KEY = ""
        mock_settings.SERPAPI_API_KEY = ""
        mock_settings.BRAVE_API_KEY = "brave_mock_key"
        mock_user_keys.get.return_value = {}
        
        result = await web_research_node(state)
        
        assert result.get("current_node") == "web_researcher"
        docs = result.get("retrieved_docs", [])
        cits = result.get("citations", [])
        
        assert len(docs) == 1
        assert docs[0]["metadata"]["source"] == "Brave Title"
        assert docs[0]["metadata"]["url"] == "https://brave.com/result"
        
        assert len(cits) == 1
        assert cits[0]["url"] == "https://brave.com/result"
        assert cits[0]["snippet"] == "This is Brave description."
