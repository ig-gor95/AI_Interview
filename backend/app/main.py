"""FastAPI application entry point"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, sessions, results, public
from app.websocket import interview

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
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(results.router, prefix="/api/results", tags=["results"])
app.include_router(public.router, tags=["public"])

# WebSocket endpoint
@app.websocket("/ws/interview/{session_id}")
async def websocket_interview_endpoint(
    websocket: WebSocket,
    session_id: str
):
    """WebSocket endpoint for live interview"""
    # Get query parameters for candidate info
    candidate_name = websocket.query_params.get("candidate_name", "Гость")
    candidate_email = websocket.query_params.get("candidate_email")
    
    await interview.handle_interview_websocket(
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
