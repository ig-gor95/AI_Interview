"""Interviews API routes - Interview templates management"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List
import uuid
import secrets

from app.database import get_db
from app.models.user import User
from app.models.interview import (
    Interview, 
    InterviewQuestion, 
    InterviewEvaluationCriterion, 
    InterviewRequirement, 
    InterviewConfig,
    InterviewLink,
    Difficulty, 
    Language, 
    Personality
)
from app.models.simulation import SimulationScenario
from app.schemas.session import SessionCreate, SessionResponse, SessionListResponse, SessionParams, CustomerSimulation, Question
from app.utils.auth import get_current_organizer
from app.config import settings
from app.services.interview_generator import get_interview_generator_service
from pydantic import BaseModel

router = APIRouter()


# Schemas for generation endpoints
class GenerateInterviewRequest(BaseModel):
    """Request schema for generating interview content"""
    job_description: str
    position: str | None = None


class GenerateCriteriaRequest(BaseModel):
    """Request schema for generating evaluation criteria"""
    position: str
    company: str | None = None


@router.post("/generate")
async def generate_interview_content(
    request: GenerateInterviewRequest,
    current_user: User = Depends(get_current_organizer)
):
    """
    Generate interview questions, criteria and simulation using AI

    This endpoint uses DeepSeek AI to generate:
    - Interview questions with clarifications
    - Must-have requirements (обязательные)
    - Nice-to-have requirements (желательные)
    - Customer simulation scenario
    """
    try:
        generator = get_interview_generator_service()
        result = await generator.generate_interview_content(
            job_description=request.job_description,
            position=request.position
        )

        return {
            "success": True,
            "data": result
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid AI response: {str(e)}"
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate content: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )


@router.post("/generate-criteria")
async def generate_evaluation_criteria(
    request: GenerateCriteriaRequest,
    current_user: User = Depends(get_current_organizer)
):
    """
    Generate only evaluation criteria based on position

    This endpoint uses DeepSeek AI to generate:
    - Must-have requirements (обязательные)
    - Nice-to-have requirements (желательные)
    """
    try:
        generator = get_interview_generator_service()
        result = await generator.generate_criteria_only(
            position=request.position,
            company=request.company
        )

        return {
            "success": True,
            "data": result
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid AI response: {str(e)}"
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate criteria: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )


@router.get("", response_model=List[SessionResponse])
async def get_interviews(
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get all interview templates created by current organizer"""
    result = await db.execute(
        select(Interview)
        .options(
            selectinload(Interview.questions),
            selectinload(Interview.evaluation_criteria),
            selectinload(Interview.requirements),
            selectinload(Interview.config)
        )
        .where(Interview.organizer_id == current_user.id)
        .where(Interview.is_active == True)
        .order_by(Interview.created_at.desc())
    )
    interviews = result.scalars().all()
    
    result_list = []
    for interview in interviews:
        params = await _interview_to_params(interview)
        result_list.append(SessionResponse(
            id=str(interview.id),
            organizer_id=str(interview.organizer_id),
            organizer_name=current_user.name,
            params=params,
            share_url=interview.share_url,
            created_at=interview.created_at,
            updated_at=interview.updated_at
        ))
    return result_list


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Soft-delete interview (set is_active=False)"""
    try:
        interview_uuid = uuid.UUID(interview_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid interview_id format")

    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_uuid)
        .where(Interview.organizer_id == current_user.id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.is_active = False
    await db.commit()


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Create a new interview template"""
    # Generate share URL
    share_url = f"/session/{uuid.uuid4()}"
    
    # Create interview with default values for fields not in the form
    new_interview = Interview(
        organizer_id=current_user.id,
        title=session_data.params.position,  # Use position as title
        position=session_data.params.position,
        company=session_data.params.company,
        difficulty=Difficulty.INTERMEDIATE,  # Default value
        duration=15,  # Default value
        language=Language.RU,  # Default value
        personality=Personality.PROFESSIONAL,  # Default value
        share_url=share_url,
        is_active=True
    )
    
    db.add(new_interview)
    await db.flush()  # Get interview ID
    
    # Add questions with nested clarifying questions
    if session_data.params.questions:
        for idx, question in enumerate(session_data.params.questions):
            # Create parent question
            parent_question = InterviewQuestion(
                interview_id=new_interview.id,
                question_text=question.text,
                order_index=idx,
                parent_question_id=None
            )
            db.add(parent_question)
            await db.flush()  # Get parent question ID
            
            # Create clarifying questions (children)
            if question.clarifying_questions:
                for clar_idx, clar_text in enumerate(question.clarifying_questions):
                    child_question = InterviewQuestion(
                        interview_id=new_interview.id,
                        question_text=clar_text,
                        order_index=clar_idx,
                        parent_question_id=parent_question.id
                    )
                    db.add(child_question)

    # Add evaluation criteria (must-have and nice-to-have requirements)
    criteria_index = 0
    if session_data.params.must_have_requirements:
        for requirement in session_data.params.must_have_requirements:
            eval_criterion = InterviewEvaluationCriterion(
                interview_id=new_interview.id,
                criterion_name=requirement,
                is_required=True,  # Обязательное требование
                order_index=criteria_index
            )
            db.add(eval_criterion)
            criteria_index += 1

    if session_data.params.nice_to_have_requirements:
        for requirement in session_data.params.nice_to_have_requirements:
            eval_criterion = InterviewEvaluationCriterion(
                interview_id=new_interview.id,
                criterion_name=requirement,
                is_required=False,  # Желательное требование
                order_index=criteria_index
            )
            db.add(eval_criterion)
            criteria_index += 1

    # Add config with customerSimulation and allowDynamicQuestions
    config = InterviewConfig(
        interview_id=new_interview.id,
        customer_simulation=session_data.params.customer_simulation.model_dump() 
            if session_data.params.customer_simulation else None,
        allow_dynamic_questions=session_data.params.allow_dynamic_questions
    )
    db.add(config)
    await db.flush()  # Ensure config is saved before creating simulation scenario
    
    # Create SimulationScenario if customer simulation is enabled
    if session_data.params.customer_simulation and session_data.params.customer_simulation.enabled:
        simulation_scenario = SimulationScenario(
            interview_id=new_interview.id,
            session_id=None,  # This is for interview template, not a session
            scenario_type="customer_simulation",
            scenario_description=session_data.params.customer_simulation.scenario or "",
            client_role=session_data.params.customer_simulation.role or "",
            client_behavior=None  # Can be derived from scenario description if needed
        )
        db.add(simulation_scenario)
    
    await db.commit()

    # Reload interview with relationships (eager load to avoid lazy load in async)
    result = await db.execute(
        select(Interview)
        .options(
            selectinload(Interview.questions),
            selectinload(Interview.evaluation_criteria),
            selectinload(Interview.config)
        )
        .where(Interview.id == new_interview.id)
    )
    new_interview = result.scalar_one()

    return SessionResponse(
        id=str(new_interview.id),
        organizer_id=str(new_interview.organizer_id),
        organizer_name=current_user.name,
        params=await _interview_to_params(new_interview),
        share_url=new_interview.share_url,
        created_at=new_interview.created_at,
        updated_at=new_interview.updated_at
    )


@router.get("/{interview_id}", response_model=SessionResponse)
async def get_interview(
    interview_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get interview template by ID"""
    try:
        interview_uuid = uuid.UUID(interview_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid interview ID")
    
    result = await db.execute(
        select(Interview)
        .options(
            selectinload(Interview.questions),
            selectinload(Interview.evaluation_criteria),
            selectinload(Interview.requirements),
            selectinload(Interview.config)
        )
        .where(Interview.id == interview_uuid)
    )
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    
    if interview.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    return SessionResponse(
        id=str(interview.id),
        organizer_id=str(interview.organizer_id),
        organizer_name=current_user.name,
        params=await _interview_to_params(interview),
        share_url=interview.share_url,
        created_at=interview.created_at,
        updated_at=interview.updated_at
    )


@router.post("/{interview_id}/links", status_code=status.HTTP_201_CREATED)
async def create_interview_link(
    interview_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Generate a link for candidate to access interview"""
    try:
        interview_uuid = uuid.UUID(interview_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid interview ID")
    
    # Get interview
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_uuid)
    )
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    
    if interview.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Generate unique token
    token = secrets.token_urlsafe(32)
    
    # Create interview link
    interview_link = InterviewLink(
        interview_id=interview.id,
        token=token,
        is_used=False
    )
    
    db.add(interview_link)
    await db.commit()
    await db.refresh(interview_link)
    
    return {
        "id": str(interview_link.id),
        "interviewId": str(interview_link.interview_id),
        "token": interview_link.token,
        "isUsed": interview_link.is_used,
        "expiresAt": interview_link.expires_at.isoformat() if interview_link.expires_at else None,
        "createdAt": interview_link.created_at.isoformat(),
        "url": f"/interview/{interview_link.token}"
    }


@router.get("/{interview_id}/links")
async def get_interview_links(
    interview_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get all links for an interview"""
    try:
        interview_uuid = uuid.UUID(interview_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid interview ID format: {interview_id}. Expected UUID format. Error: {str(e)}"
        )
    
    # Get interview
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_uuid)
    )
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    
    if interview.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Get links
    result = await db.execute(
        select(InterviewLink)
        .where(InterviewLink.interview_id == interview.id)
        .order_by(InterviewLink.created_at.desc())
    )
    links = result.scalars().all()
    
    return [
        {
            "id": str(link.id),
            "interviewId": str(link.interview_id),
            "token": link.token,
            "isUsed": link.is_used,
            "expiresAt": link.expires_at.isoformat() if link.expires_at else None,
            "sessionId": str(link.session_id) if link.session_id else None,
            "createdAt": link.created_at.isoformat(),
            "url": f"/interview/{link.token}"
        }
        for link in links
    ]


@router.delete("/{interview_id}/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview_link(
    interview_id: str,
    link_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Delete an interview link"""
    try:
        interview_uuid = uuid.UUID(interview_id)
        link_uuid = uuid.UUID(link_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format")
    
    # Get interview
    result = await db.execute(
        select(Interview)
        .where(Interview.id == interview_uuid)
    )
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    
    if interview.organizer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    # Get link
    result = await db.execute(
        select(InterviewLink)
        .where(InterviewLink.id == link_uuid)
        .where(InterviewLink.interview_id == interview.id)
    )
    link = result.scalar_one_or_none()
    
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    
    # Delete link
    await db.execute(
        delete(InterviewLink)
        .where(InterviewLink.id == link_uuid)
    )
    await db.commit()
    
    return None


async def _interview_to_params(interview: Interview) -> SessionParams:
    """Convert interview model to SessionParams"""
    # Group questions by parents
    parent_questions = [q for q in interview.questions if q.parent_question_id is None]
    parent_questions.sort(key=lambda x: x.order_index)
    
    questions = []
    for parent in parent_questions:
        children = [q for q in interview.questions if q.parent_question_id == parent.id]
        children.sort(key=lambda x: x.order_index)
        
        questions.append(Question(
            text=parent.question_text,
            clarifying_questions=[c.question_text for c in children] if children else None
        ))
    
    # Get config
    config = interview.config
    
    # Customer simulation
    customer_simulation = None
    if config and config.customer_simulation:
        cs_data = config.customer_simulation
        customer_simulation = CustomerSimulation(
            enabled=cs_data.get("enabled", False),
            scenario=cs_data.get("scenario"),
            role=cs_data.get("role")
        )
    
    # Allow dynamic questions
    allow_dynamic_questions = None
    if config and config.allow_dynamic_questions is not None:
        allow_dynamic_questions = config.allow_dynamic_questions

    # Evaluation criteria - separate must-have and nice-to-have
    must_have_requirements = []
    nice_to_have_requirements = []
    if interview.evaluation_criteria:
        for criterion in interview.evaluation_criteria:
            if criterion.is_required:
                must_have_requirements.append(criterion.criterion_name)
            else:
                nice_to_have_requirements.append(criterion.criterion_name)

    return SessionParams(
        position=interview.position or "",
        company=interview.company,
        questions=questions,
        must_have_requirements=must_have_requirements if must_have_requirements else None,
        nice_to_have_requirements=nice_to_have_requirements if nice_to_have_requirements else None,
        allow_dynamic_questions=allow_dynamic_questions,
        customer_simulation=customer_simulation
    )

