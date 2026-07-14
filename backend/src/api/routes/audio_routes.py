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
from src.core.security import get_current_user
from src.core.config import settings
from src.core.logger import get_logger

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


@router.get("/tts", summary="Convert text to speech stream using Google Cloud TTS")
async def text_to_speech(
    text: str = Query(...),
    current_user=Depends(get_current_user),
):
    """
    Converts assistant text into spoken audio stream using Google Cloud TTS.
    If GOOGLE_API_KEY is not set, returns a 400 error indicating browser TTS fallback.
    """
    if not settings.GOOGLE_API_KEY:
        # Signalling browser fallback to save API requests and handle local synthesis
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="google_tts_disabled",
        )

    logger.info(f"[Audio] Converting text to speech (Google Cloud TTS), length={len(text)}")

    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={settings.GOOGLE_API_KEY}"
    
    payload = {
        "input": {
            "text": text
        },
        "voice": {
            "languageCode": "en-US",
            "name": "en-US-Neural2-F"
        },
        "audioConfig": {
            "audioEncoding": "MP3"
        }
    }

    headers = {
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=20.0)

        if response.status_code != 200:
            logger.error(f"[Audio] Google Cloud TTS error status={response.status_code}: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Google Cloud TTS API error: {response.text[:100]}"
            )

        result = response.json()
        audio_content_base64 = result.get("audioContent", "")
        if not audio_content_base64:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google Cloud TTS did not return audioContent."
            )

        import base64
        import io
        audio_bytes = base64.b64decode(audio_content_base64)
        return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")

    except Exception as e:
        logger.error(f"[Audio] Google Cloud TTS exception: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google Cloud TTS failed: {str(e)}"
        )
