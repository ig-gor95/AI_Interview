"""FastAPI application entry point"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, interviews, results, public
from app.websocket import session, stt as stt_ws

app = FastAPI(
    title="AI HR Interview API",
    description="Backend API for AI-powered HR interview system",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["interviews"])
app.include_router(results.router, prefix="/api/results", tags=["results"])
app.include_router(public.router, prefix="/api", tags=["public"])

# WebSocket endpoint
@app.websocket("/ws/session/{session_id}")
async def websocket_session_endpoint(
    websocket: WebSocket,
    session_id: str
):
    """WebSocket endpoint for live interview session"""
    # Get query parameters for candidate info
    candidate_name = websocket.query_params.get("candidate_name", "Гость")
    candidate_email = websocket.query_params.get("candidate_email")
    
    await session.handle_session_websocket(
        websocket=websocket,
        session_id=session_id,
        candidate_name=candidate_name,
        candidate_email=candidate_email
    )


@app.websocket("/ws/stt/{session_id}")
async def websocket_stt_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket for streaming speech-to-text. Send binary PCM (LINEAR16, 16kHz, mono)."""
    await stt_ws.handle_stt_websocket(websocket=websocket, session_id=session_id)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI HR Interview API", "version": "0.1.0"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


# Filler phrases for when GPT response is slow (pre-loaded TTS)
FILLER_PHRASES_RU = [
    "Спасибо за ответ.",
    "Ммм…",
    "Хорошо, тогда такой вопрос…",
    "Эмммм…",
    "Понятно, продолжайте.",
]
_filler_audio_cache: dict = {}


@app.get("/api/audio/filler/{index}")
async def get_filler_audio(index: int):
    """Get pre-generated filler audio for when AI response is slow (no auth required)"""
    from fastapi.responses import Response
    from fastapi import HTTPException
    from app.core import tts_service

    if index < 0 or index >= len(FILLER_PHRASES_RU):
        raise HTTPException(status_code=400, detail="Invalid index")
    if tts_service is None:
        raise HTTPException(status_code=503, detail="TTS not available")
    cache_key = f"filler_{index}_ru"
    if cache_key not in _filler_audio_cache:
        try:
            audio_bytes = await tts_service.text_to_speech(
                text=FILLER_PHRASES_RU[index],
                language_code="ru-RU",
            )
            _filler_audio_cache[cache_key] = audio_bytes
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return Response(
        content=_filler_audio_cache[cache_key],
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
