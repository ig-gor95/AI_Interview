"""Sessions API routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from app.database import get_db
from app.models.user import User
from app.models.session import Session, SessionQuestion, SessionEvaluationCriterion, SessionRequirement, SessionConfig
from app.schemas.session import SessionCreate, SessionResponse, SessionListResponse, SessionParams, CustomerSimulation
from app.utils.auth import get_current_organizer
from app.config import settings

router = APIRouter()


@router.get("", response_model=List[SessionResponse])
async def get_sessions(
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get all sessions created by current organizer"""
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.questions),
            selectinload(Session.evaluation_criteria),
            selectinload(Session.requirements),
            selectinload(Session.config)
        )
        .where(Session.organizer_id == current_user.id)
        .order_by(Session.created_at.desc())
    )
    sessions = result.scalars().all()
    
    return [
        SessionResponse(
            id=str(session.id),
            organizer_id=str(session.organizer_id),
            organizer_name=current_user.name,
            params=_session_to_params(session),
            share_url=session.share_url,
            created_at=session.created_at,
            updated_at=session.updated_at
        )
        for session in sessions
    ]


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Create a new interview session"""
    # Generate share URL
    share_url = f"/session/{uuid.uuid4()}"
    
    # Create session
    new_session = Session(
        organizer_id=current_user.id,
        title=session_data.params.topic or session_data.params.position or "AI Интервью",
        position=session_data.params.position,
        company=session_data.params.company,
        difficulty=session_data.params.difficulty,
        duration=session_data.params.duration,
        language=session_data.params.language,
        personality=session_data.params.personality,
        interview_type=session_data.params.interview_type,
        passing_score=session_data.params.passing_score,
        share_url=share_url,
        is_active=True
    )
    
    db.add(new_session)
    await db.flush()  # Get session ID
    
    # Add questions
    if session_data.params.questions:
        for idx, question_text in enumerate(session_data.params.questions):
            question = SessionQuestion(
                session_id=new_session.id,
                question_text=question_text,
                order_index=idx
            )
            db.add(question)
    
    # Add evaluation criteria
    if session_data.params.evaluation_criteria:
        for idx, criterion in enumerate(session_data.params.evaluation_criteria):
            criterion_obj = SessionEvaluationCriterion(
                session_id=new_session.id,
                criterion_name=criterion,
                order_index=idx
            )
            db.add(criterion_obj)
    
    # Add requirements
    if session_data.params.requirements:
        for idx, requirement_text in enumerate(session_data.params.requirements):
            requirement = SessionRequirement(
                session_id=new_session.id,
                requirement_text=requirement_text,
                order_index=idx
            )
            db.add(requirement)
    
    # Add config
    config = SessionConfig(
        session_id=new_session.id,
        goals=session_data.params.goals if session_data.params.goals else None,
        role_context=session_data.params.role_context,
        context_description=session_data.params.context_description,
        expected_knowledge=session_data.params.expected_knowledge,
        interaction_style=session_data.params.interaction_style,
        focus_areas=session_data.params.focus_areas if session_data.params.focus_areas else None,
        additional_instructions=session_data.params.additional_instructions,
        customer_simulation=session_data.params.customer_simulation.model_dump() if session_data.params.customer_simulation else None
    )
    db.add(config)
    
    await db.commit()
    await db.refresh(new_session)
    
    # Reload session with relationships
    await db.refresh(new_session, ["questions", "evaluation_criteria", "requirements", "config"])
    
    return SessionResponse(
        id=str(new_session.id),
        organizer_id=str(new_session.organizer_id),
        organizer_name=current_user.name,
        params=await _session_to_params(new_session),
        share_url=new_session.share_url,
        created_at=new_session.created_at,
        updated_at=new_session.updated_at
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get session by ID"""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID")
    
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.questions),
            selectinload(Session.evaluation_criteria),
            selectinload(Session.requirements),
            selectinload(Session.config)
        )
        .where(Session.id == session_uuid)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    return SessionResponse(
        id=str(session.id),
        organizer_id=str(session.organizer_id),
        organizer_name=current_user.name,
        params=await _session_to_params(session),
        share_url=session.share_url,
        created_at=session.created_at,
        updated_at=session.updated_at
    )


@router.get("/{session_id}/results")
async def get_session_results(
    session_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get results for a session"""
    # TODO: Implement when interview and evaluation models are used
    return {"message": f"Results for session {session_id} - to be implemented"}


def _session_to_params(session: Session) -> SessionParams:
    """Convert session model to SessionParams"""
    # Get questions
    questions = [q.question_text for q in sorted(session.questions, key=lambda x: x.order_index)] if session.questions else []
    
    # Get evaluation criteria
    evaluation_criteria = [c.criterion_name for c in sorted(session.evaluation_criteria, key=lambda x: x.order_index)] if session.evaluation_criteria else []
    
    # Get requirements
    requirements = [r.requirement_text for r in sorted(session.requirements, key=lambda x: x.order_index)] if session.requirements else []
    
    # Get config
    config = session.config
    goals = config.goals if config and config.goals else []
    focus_areas = config.focus_areas if config and config.focus_areas else []
    
    # Customer simulation
    customer_simulation = None
    if config and config.customer_simulation:
        cs_data = config.customer_simulation
        customer_simulation = CustomerSimulation(
            enabled=cs_data.get("enabled", False),
            scenario=cs_data.get("scenario"),
            role=cs_data.get("role")
        )
    
    return SessionParams(
        topic=session.title,
        position=session.position,
        company=session.company,
        difficulty=session.difficulty,
        duration=session.duration,
        language=session.language,
        personality=session.personality,
        interview_type=session.interview_type,
        passing_score=session.passing_score,
        questions=questions if questions else None,
        evaluation_criteria=evaluation_criteria if evaluation_criteria else None,
        requirements=requirements if requirements else None,
        goals=goals,
        focus_areas=focus_areas if focus_areas else None,
        role_context=config.role_context if config else None,
        context_description=config.context_description if config else None,
        expected_knowledge=config.expected_knowledge if config else None,
        interaction_style=config.interaction_style if config else None,
        additional_instructions=config.additional_instructions if config else None,
        customer_simulation=customer_simulation
    )
