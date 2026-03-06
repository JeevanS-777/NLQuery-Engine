import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.nlp.llm_client import llm_client

router = APIRouter(prefix="/voice", tags=["Voice Integration"])

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Receives an audio blob, sends it to Groq/Whisper, and returns text.
    """
    try:
        # 1. Validation
        if not llm_client.client:
            raise HTTPException(status_code=503, detail="LLM Client not initialized")

        # 2. Transcribe using Groq's Audio Endpoint
        # We pass the raw file object directly to the API
        transcription = llm_client.client.audio.transcriptions.create(
            file=(file.filename, file.file, "audio/webm"), # WebM is standard for browser recording
            model="distil-whisper-large-v3-en", # Ultra-low latency model
            response_format="json"
        )

        return {"text": transcription.text}

    except Exception as e:
        print(f"Transcription Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
