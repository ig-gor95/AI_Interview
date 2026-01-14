"""Public API routes - no authentication required"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid

from app.database import get_db
from app.models.session import Session
from app.models.user import User
from app.schemas.session import SessionResponse
from app.api.sessions import _session_to_params

router = APIRouter()


@router.get("/session/{share_url:path}", response_model=SessionResponse)
async def get_session_by_url(
    share_url: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get session by share URL (public endpoint for candidates)
    
    share_url should be in format: /session/{session_id}
    """
    # Extract session ID from URL
    if not share_url.startswith("/session/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid share URL format"
        )
    
    session_id_str = share_url.replace("/session/", "").strip()
    
    try:
        session_uuid = uuid.UUID(session_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID"
        )
    
    # Get session
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.questions),
            selectinload(Session.evaluation_criteria),
            selectinload(Session.requirements),
            selectinload(Session.config)
        )
        .where(Session.share_url == share_url, Session.is_active == True)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or inactive"
        )
    
    # Get organizer name
    organizer_result = await db.execute(
        select(User).where(User.id == session.organizer_id)
    )
    organizer = organizer_result.scalar_one_or_none()
    organizer_name = organizer.name if organizer else "Organizer"
    
    return SessionResponse(
        id=str(session.id),
        organizer_id=str(session.organizer_id),
        organizer_name=organizer_name,
        params=_session_to_params(session),
        share_url=session.share_url,
        created_at=session.created_at,
        updated_at=session.updated_at
    )

