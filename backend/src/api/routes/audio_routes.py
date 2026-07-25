"""
src/api/routes/audio_routes.py — Audio processing routes (transcribe & TTS)
==========================================================================
Accepts audio recording uploads and returns transcribed text using Google Gemini LLM.
Synthesizes and streams text-to-speech outputs using Google Cloud TTS.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
import httpx
import base64
import io
from core.security import get_current_user
from core.config import settings
from core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("/transcribe", summary="Transcribe spoken audio from microphone using Google LLM")
async def transcribe(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """
    Uploads a voice recording and transcribes it using Google Gemini (gemini-2.5-flash) multimodal capabilities.
    """
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google API Key is not configured on the backend.",
        )

    logger.info(f"[Audio] Transcribing file={file.filename}, type={file.content_type} using Google LLM")

    try:
        # Read the file bytes
        file_bytes = await file.read()
        audio_base64 = base64.b64encode(file_bytes).decode("utf-8")
        
        # Mime type normalization: if webm, use audio/webm, or audio/mp3 etc.
        mime_type = file.content_type or "audio/webm"
        if "octet-stream" in mime_type:
            mime_type = "audio/webm"

        # Call Gemini 2.5 Flash for multimodal audio transcription
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GOOGLE_API_KEY}"
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": audio_base64
                            }
                        },
                        {
                            "text": "Transcribe this audio precisely. Output ONLY the transcription text, do not add any comments, notes or extra words."
                        }
                    ]
                }
            ]
        }

        headers = {
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
                timeout=30.0
            )

        if response.status_code != 200:
            logger.error(f"[Audio] Gemini transcription API error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Gemini transcription error: {response.text[:100]}"
            )

        result = response.json()
        try:
            transcript = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError) as parse_err:
            logger.error(f"[Audio] Failed to parse Gemini response: {result} - error: {parse_err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to parse transcription from Google LLM response."
            )

        logger.info(f"[Audio] Transcription success: '{transcript[:60]}'")
        return {"text": transcript}

    except Exception as e:
        logger.error(f"[Audio] Transcription failed: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )


@router.get("/tts", summary="Convert text to speech stream")
async def text_to_speech(
    text: str = Query(...),
    current_user=Depends(get_current_user),
):
    """
    Converts assistant text into spoken audio stream using Google Translate TTS service.
    If TTS fails or is disabled, returns 400 so the browser can fall back to Web Speech Synthesis.
    """
    logger.info(f"[Audio] Converting text to speech, length={len(text)}")

    import re
    # Clean Markdown formatting and citations for speech synthesis
    clean_text = re.sub(r'\[\d+\]', '', text)
    clean_text = re.sub(r'[*_`#~]', '', clean_text).strip()
    
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tts_empty_text",
        )

    # Limit chunk to 500 chars for fast playback
    chunk = clean_text[:500]

    try:
        import urllib.parse
        encoded_text = urllib.parse.quote(chunk)
        tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q={encoded_text}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(tts_url, headers=headers, timeout=10.0)

        if response.status_code == 200 and len(response.content) > 100:
            import io
            return StreamingResponse(io.BytesIO(response.content), media_type="audio/mpeg")
        else:
            logger.warning(f"[Audio] Google Translate TTS failed status={response.status_code}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="google_tts_disabled",
            )
    except Exception as e:
        logger.warning(f"[Audio] TTS conversion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="google_tts_disabled",
        )
