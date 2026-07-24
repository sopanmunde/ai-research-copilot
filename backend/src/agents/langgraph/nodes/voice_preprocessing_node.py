"""
src/agents/langgraph/nodes/voice_preprocessing_node.py — Voice Preprocessing Agent
==================================================================================
If is_voice is True, cleans disfluencies, repetitions, and formatting issues.
"""
from langchain_core.messages import SystemMessage, HumanMessage
from agents.langgraph.state import AgentState
from core.llm_factory import get_llm
from core.logger import get_logger

logger = get_logger(__name__)

VOICE_CLEANER_SYSTEM = """You are an AI assistant that cleans and formats spoken voice queries.
A user has spoken a query, which has been transcribed by an Automatic Speech Recognition (ASR) system. It may contain filler words (uh, um, like), repetitions, or lack proper punctuation.

Your job:
1. Clean up filler words, false starts, and speech disfluencies.
2. Fix formatting, capitalization, and punctuation.
3. Keep the user's original intent exactly the same. Do NOT add new questions or change the semantic meaning.
4. Output ONLY the cleaned query text. Do not add conversational filler, introductions, or explanations.
"""


async def voice_preprocessing_node(state: AgentState) -> dict:
    """
    Voice Preprocessor Node — cleans up transcribed queries if state["is_voice"] is True.
    """
    is_voice = state.get("is_voice", False)
    query = state.get("query", "")

    if not is_voice:
        logger.info("[Voice Preprocessor] is_voice=False — bypassing voice cleaning")
        return {
            "current_node": "voice_preprocessor",
        }

    provider = state.get("selected_llm_provider", "")
    model_name = state.get("selected_llm_model", "")

    logger.info(f"[Voice Preprocessor] Original spoken query: '{query}'")

    try:
        llm = get_llm(provider=provider, model_name=model_name, temperature=0.1)
        messages = [
            SystemMessage(content=VOICE_CLEANER_SYSTEM),
            HumanMessage(content=f"ASR Transcript: {query}")
        ]
        response = await llm.ainvoke(messages)
        cleaned_query = response.content.strip()
        logger.info(f"[Voice Preprocessor] Cleaned spoken query: '{cleaned_query}'")
        return {
            "query": cleaned_query,
            "current_node": "voice_preprocessor",
        }
    except Exception as e:
        logger.warning(f"[Voice Preprocessor] Cleaning failed: {e}. Using original query.")
        return {
            "current_node": "voice_preprocessor",
        }
