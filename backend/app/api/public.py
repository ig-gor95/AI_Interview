"""Public API routes - no authentication required"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
import uuid
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from app.database import get_db
from app.models.interview import Interview, InterviewLink
from app.models.session import Session, SessionStatus
from app.models.user import User
from app.schemas.session import SessionResponse, SessionParams, Question, CustomerSimulation
from app.api.interviews import _interview_to_params

router = APIRouter()


class CandidateRegistrationData(BaseModel):
    """Candidate registration data"""
    firstName: str
    lastName: str
    email: Optional[str] = None
    
    class Config:
        populate_by_name = True


class InterviewResponse(BaseModel):
    """Interview template response for public API"""
    id: str
    position: str
    company: Optional[str] = None
    params: SessionParams


class SessionResponsePublic(BaseModel):
    """Session response for public API"""
    id: str
    interview_id: str = Field(alias="interviewId")
    candidate_name: str = Field(alias="candidateName")
    candidate_surname: Optional[str] = Field(None, alias="candidateSurname")
    candidate_email: Optional[str] = Field(None, alias="candidateEmail")
    status: str
    created_at: datetime = Field(alias="createdAt")
    
    class Config:
        populate_by_name = True


@router.get("/interview/{token}", response_model=InterviewResponse)
async def get_interview_by_token(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Get interview template by token (public endpoint for candidates)
    
    Returns information about the interview template without authentication
    """
    # Get interview link
    result = await db.execute(
        select(InterviewLink)
        .options(selectinload(InterviewLink.interview))
        .where(InterviewLink.token == token)
    )
    link = result.scalar_one_or_none()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview link not found"
        )
    
    # Check if link is expired
    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Interview link has expired"
        )
    
    # Get interview
    interview = link.interview
    if not interview or not interview.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found or inactive"
        )
    
    # Reload interview with relationships
    await db.refresh(interview, ["questions", "config", "evaluation_criteria", "requirements"])
    
    params = await _interview_to_params(interview)
    
    return InterviewResponse(
        id=str(interview.id),
        position=interview.position or "",
        company=interview.company,
        params=params
    )


@router.post("/interview/{token}/register", response_model=SessionResponsePublic)
async def register_candidate(
    token: str,
    candidate_data: CandidateRegistrationData,
    db: AsyncSession = Depends(get_db)
):
    """Register candidate and create session (public endpoint)
    
    Creates a Session (concrete interview session) for the candidate
    """
    # Get interview link
    result = await db.execute(
        select(InterviewLink)
        .options(selectinload(InterviewLink.interview))
        .where(InterviewLink.token == token)
    )
    link = result.scalar_one_or_none()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview link not found"
        )
    
    # Check if link is expired
    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Interview link has expired"
        )
    
    # Check if link is already used
    if link.is_used:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Interview link has already been used"
        )
    
    # Get interview
    interview = link.interview
    if not interview or not interview.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found or inactive"
        )
    
    # Create session
    new_session = Session(
        interview_id=interview.id,
        candidate_name=candidate_data.firstName,
        candidate_surname=candidate_data.lastName,
        candidate_email=candidate_data.email,
        status=SessionStatus.PENDING
    )
    
    db.add(new_session)
    await db.flush()  # Get session ID
    
    # Update link
    link.is_used = True
    link.session_id = new_session.id
    
    await db.commit()
    await db.refresh(new_session)
    
    return SessionResponsePublic(
        id=str(new_session.id),
        interview_id=str(new_session.interview_id),
        candidate_name=new_session.candidate_name,
        candidate_surname=new_session.candidate_surname,
        candidate_email=new_session.candidate_email,
        status=new_session.status.value,
        created_at=new_session.created_at
    )


@router.post("/interview/{token}/start")
async def start_session(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Start session after registration (public endpoint)
    
    Marks the session as IN_PROGRESS and returns session ID for WebSocket connection.
    If session is already IN_PROGRESS, returns resume flag and transcript history.
    """
    # Get interview link with session
    result = await db.execute(
        select(InterviewLink)
        .options(
            selectinload(InterviewLink.session).selectinload(Session.transcript_messages),
            selectinload(InterviewLink.session).selectinload(Session.question_answers)
        )
        .where(InterviewLink.token == token)
    )
    link = result.scalar_one_or_none()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview link not found"
        )
    
    if not link.session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session not created. Please register first."
        )
    
    session = link.session
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Проверяем, является ли это восстановлением незавершенной сессии
    is_resume = session.status == SessionStatus.IN_PROGRESS
    
    # Update session status только если PENDING
    if session.status == SessionStatus.PENDING:
        session.status = SessionStatus.IN_PROGRESS
        session.started_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(session)
    
    # Загружаем интервью для получения длительности
    result_interview = await db.execute(
        select(Interview)
        .where(Interview.id == session.interview_id)
    )
    interview = result_interview.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview template not found"
        )
    
    # Загружаем историю транскрипта для восстановления
    transcript_history = []
    if is_resume and session.transcript_messages:
        transcript_messages = sorted(session.transcript_messages, key=lambda x: x.order_index)
        transcript_history = [
            {
                "role": msg.role,
                "message": msg.message_text,
                "timestamp": msg.timestamp.isoformat(),
                "audioUrl": msg.audio_chunk_url
            }
            for msg in transcript_messages
        ]
    
    # Вычисляем оставшееся время
    duration_seconds = interview.duration * 60  # duration в минутах
    remaining_seconds = duration_seconds
    
    if is_resume and session.started_at:
        elapsed = datetime.now(timezone.utc) - session.started_at
        elapsed_seconds = int(elapsed.total_seconds())
        remaining_seconds = max(0, duration_seconds - elapsed_seconds)
    
    return {
        "sessionId": str(session.id),
        "status": session.status.value,
        "startedAt": session.started_at.isoformat() if session.started_at else None,
        "isResume": is_resume,
        "transcript": transcript_history if is_resume else [],
        "duration": interview.duration,  # в минутах
        "remainingSeconds": remaining_seconds  # оставшееся время в секундах
    }
