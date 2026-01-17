"""FastAPI application entry point"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, interviews, results, public
from app.websocket import session

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


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI HR Interview API", "version": "0.1.0"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
