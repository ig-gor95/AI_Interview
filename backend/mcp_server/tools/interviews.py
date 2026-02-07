"""Interview management MCP tools."""
import json
import uuid
import secrets
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from mcp_server.db import get_session
from app.models import (
    Interview, InterviewQuestion, InterviewEvaluationCriterion,
    InterviewRequirement, InterviewConfig, InterviewLink,
    SimulationScenario, Session, User,
)


def _serialize_uuid(val):
    return str(val) if val else None


def _serialize_dt(val):
    return val.isoformat() if val else None


async def list_interviews(
    is_active: Optional[bool] = None,
    organizer_email: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> str:
    """List all interview templates with basic info.

    Args:
        is_active: Filter by active status (true/false/null for all)
        organizer_email: Filter by organizer email
        limit: Max results (default 50)
        offset: Skip first N results
    """
    async with get_session() as db:
        query = select(Interview).options(
            selectinload(Interview.sessions),
        ).order_by(Interview.created_at.desc())

        if is_active is not None:
            query = query.where(Interview.is_active == is_active)

        if organizer_email:
            org = await db.execute(select(User).where(User.email == organizer_email))
            organizer = org.scalar_one_or_none()
            if organizer:
                query = query.where(Interview.organizer_id == organizer.id)
            else:
                return json.dumps({"error": f"Organizer not found: {organizer_email}"})

        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        interviews = result.scalars().all()

        # Count total
        count_q = select(func.count(Interview.id))
        if is_active is not None:
            count_q = count_q.where(Interview.is_active == is_active)
        total = (await db.execute(count_q)).scalar()

        items = []
        for iv in interviews:
            items.append({
                "id": _serialize_uuid(iv.id),
                "title": iv.title,
                "position": iv.position,
                "company": iv.company,
                "difficulty": iv.difficulty.value if iv.difficulty else None,
                "duration": iv.duration,
                "language": iv.language.value if iv.language else None,
                "interview_type": iv.interview_type.value if iv.interview_type else None,
                "is_active": iv.is_active,
                "sessions_count": len(iv.sessions),
                "created_at": _serialize_dt(iv.created_at),
            })

        return json.dumps({"interviews": items, "total": total}, ensure_ascii=False)


async def get_interview(interview_id: str) -> str:
    """Get full interview details including questions, criteria, requirements, and config.

    Args:
        interview_id: UUID of the interview template
    """
    async with get_session() as db:
        result = await db.execute(
            select(Interview).options(
                selectinload(Interview.questions),
                selectinload(Interview.evaluation_criteria),
                selectinload(Interview.requirements),
                selectinload(Interview.config),
                selectinload(Interview.links),
                selectinload(Interview.simulation_scenarios),
            ).where(Interview.id == uuid.UUID(interview_id))
        )
        iv = result.scalar_one_or_none()
        if not iv:
            return json.dumps({"error": "Interview not found"})

        # Separate main and clarifying questions
        main_questions = []
        clarifying_map = {}
        for q in sorted(iv.questions, key=lambda x: x.order_index):
            if q.parent_question_id is None:
                main_questions.append(q)
            else:
                pid = str(q.parent_question_id)
                clarifying_map.setdefault(pid, []).append(q)

        questions = []
        for q in main_questions:
            qid = str(q.id)
            questions.append({
                "id": qid,
                "text": q.question_text,
                "order": q.order_index,
                "clarifying_questions": [
                    {"id": _serialize_uuid(cq.id), "text": cq.question_text, "order": cq.order_index}
                    for cq in clarifying_map.get(qid, [])
                ],
            })

        config = None
        if iv.config:
            c = iv.config
            config = {
                "goals": c.goals,
                "role_context": c.role_context,
                "context_description": c.context_description,
                "expected_knowledge": c.expected_knowledge,
                "interaction_style": c.interaction_style,
                "focus_areas": c.focus_areas,
                "additional_instructions": c.additional_instructions,
                "customer_simulation": c.customer_simulation,
                "allow_dynamic_questions": c.allow_dynamic_questions,
            }

        data = {
            "id": _serialize_uuid(iv.id),
            "organizer_id": _serialize_uuid(iv.organizer_id),
            "title": iv.title,
            "position": iv.position,
            "company": iv.company,
            "difficulty": iv.difficulty.value if iv.difficulty else None,
            "duration": iv.duration,
            "language": iv.language.value if iv.language else None,
            "personality": iv.personality.value if iv.personality else None,
            "interview_type": iv.interview_type.value if iv.interview_type else None,
            "passing_score": iv.passing_score,
            "share_url": iv.share_url,
            "is_active": iv.is_active,
            "questions": questions,
            "evaluation_criteria": [
                {"id": _serialize_uuid(ec.id), "name": ec.criterion_name, "order": ec.order_index}
                for ec in sorted(iv.evaluation_criteria, key=lambda x: x.order_index)
            ],
            "requirements": [
                {"id": _serialize_uuid(r.id), "text": r.requirement_text, "order": r.order_index}
                for r in sorted(iv.requirements, key=lambda x: x.order_index)
            ],
            "config": config,
            "links": [
                {
                    "id": _serialize_uuid(lnk.id),
                    "token": lnk.token,
                    "is_used": lnk.is_used,
                    "expires_at": _serialize_dt(lnk.expires_at),
                    "session_id": _serialize_uuid(lnk.session_id),
                }
                for lnk in iv.links
            ],
            "created_at": _serialize_dt(iv.created_at),
            "updated_at": _serialize_dt(iv.updated_at),
        }
        return json.dumps(data, ensure_ascii=False)


async def create_interview(
    organizer_email: str,
    position: str,
    duration: int,
    questions: list[dict],
    title: Optional[str] = None,
    company: Optional[str] = None,
    difficulty: str = "intermediate",
    language: str = "ru",
    personality: str = "professional",
    interview_type: Optional[str] = None,
    passing_score: Optional[int] = None,
    evaluation_criteria: Optional[list[str]] = None,
    requirements: Optional[list[str]] = None,
    allow_dynamic_questions: bool = False,
    goals: Optional[list[str]] = None,
    additional_instructions: Optional[str] = None,
) -> str:
    """Create a new interview template.

    Args:
        organizer_email: Email of the organizer (must exist)
        position: Job position name
        duration: Interview duration in minutes
        questions: List of {"text": "...", "clarifying": ["...", "..."]}
        title: Interview title
        company: Company name
        difficulty: beginner/intermediate/advanced
        language: ru/en
        personality: friendly/professional/motivating
        interview_type: screening/technical/behavioral/mixed
        passing_score: Minimum passing score (0-100)
        evaluation_criteria: List of criterion names
        requirements: List of requirement texts
        allow_dynamic_questions: Allow AI to generate extra questions
        goals: List of interview goals
        additional_instructions: Extra instructions for AI
    """
    from app.models.interview import Difficulty, Language, Personality, InterviewType

    async with get_session() as db:
        # Find organizer
        org_result = await db.execute(select(User).where(User.email == organizer_email))
        organizer = org_result.scalar_one_or_none()
        if not organizer:
            return json.dumps({"error": f"Organizer not found: {organizer_email}"})

        share_url = secrets.token_urlsafe(16)

        interview = Interview(
            organizer_id=organizer.id,
            title=title,
            position=position,
            company=company,
            difficulty=Difficulty(difficulty),
            duration=duration,
            language=Language(language),
            personality=Personality(personality),
            interview_type=InterviewType(interview_type) if interview_type else None,
            passing_score=passing_score,
            share_url=share_url,
            is_active=True,
        )
        db.add(interview)
        await db.flush()

        # Add questions
        for idx, q in enumerate(questions):
            main_q = InterviewQuestion(
                interview_id=interview.id,
                question_text=q["text"],
                order_index=idx,
            )
            db.add(main_q)
            await db.flush()

            for cidx, cq_text in enumerate(q.get("clarifying", [])):
                db.add(InterviewQuestion(
                    interview_id=interview.id,
                    question_text=cq_text,
                    order_index=cidx,
                    parent_question_id=main_q.id,
                ))

        # Add evaluation criteria
        for idx, crit in enumerate(evaluation_criteria or []):
            db.add(InterviewEvaluationCriterion(
                interview_id=interview.id,
                criterion_name=crit,
                order_index=idx,
            ))

        # Add requirements
        for idx, req in enumerate(requirements or []):
            db.add(InterviewRequirement(
                interview_id=interview.id,
                requirement_text=req,
                order_index=idx,
            ))

        # Add config
        db.add(InterviewConfig(
            interview_id=interview.id,
            allow_dynamic_questions=allow_dynamic_questions,
            goals=goals,
            additional_instructions=additional_instructions,
        ))

        return json.dumps({
            "id": _serialize_uuid(interview.id),
            "position": position,
            "share_url": share_url,
            "status": "created",
        }, ensure_ascii=False)


async def update_interview(
    interview_id: str,
    title: Optional[str] = None,
    position: Optional[str] = None,
    company: Optional[str] = None,
    duration: Optional[int] = None,
    is_active: Optional[bool] = None,
    passing_score: Optional[int] = None,
) -> str:
    """Update interview template fields.

    Args:
        interview_id: UUID of the interview
        title: New title
        position: New position
        company: New company
        duration: New duration in minutes
        is_active: Activate/deactivate
        passing_score: New passing score
    """
    async with get_session() as db:
        result = await db.execute(
            select(Interview).where(Interview.id == uuid.UUID(interview_id))
        )
        iv = result.scalar_one_or_none()
        if not iv:
            return json.dumps({"error": "Interview not found"})

        if title is not None:
            iv.title = title
        if position is not None:
            iv.position = position
        if company is not None:
            iv.company = company
        if duration is not None:
            iv.duration = duration
        if is_active is not None:
            iv.is_active = is_active
        if passing_score is not None:
            iv.passing_score = passing_score

        return json.dumps({
            "id": _serialize_uuid(iv.id),
            "status": "updated",
        })


async def generate_interview_link(
    interview_id: str,
    expires_hours: Optional[int] = None,
) -> str:
    """Generate a shareable link for candidates to access the interview.

    Args:
        interview_id: UUID of the interview
        expires_hours: Link expiration in hours (null = no expiration)
    """
    from datetime import timedelta

    async with get_session() as db:
        result = await db.execute(
            select(Interview).where(Interview.id == uuid.UUID(interview_id))
        )
        iv = result.scalar_one_or_none()
        if not iv:
            return json.dumps({"error": "Interview not found"})

        token = secrets.token_urlsafe(32)
        expires_at = None
        if expires_hours:
            expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_hours)

        link = InterviewLink(
            interview_id=iv.id,
            token=token,
            expires_at=expires_at,
        )
        db.add(link)
        await db.flush()

        return json.dumps({
            "id": _serialize_uuid(link.id),
            "token": token,
            "url": f"/interview/{token}",
            "expires_at": _serialize_dt(expires_at),
            "status": "created",
        })


async def list_interview_links(interview_id: str) -> str:
    """List all shareable links for an interview.

    Args:
        interview_id: UUID of the interview
    """
    async with get_session() as db:
        result = await db.execute(
            select(InterviewLink)
            .where(InterviewLink.interview_id == uuid.UUID(interview_id))
            .order_by(InterviewLink.created_at.desc())
        )
        links = result.scalars().all()

        items = []
        for lnk in links:
            items.append({
                "id": _serialize_uuid(lnk.id),
                "token": lnk.token,
                "is_used": lnk.is_used,
                "expires_at": _serialize_dt(lnk.expires_at),
                "session_id": _serialize_uuid(lnk.session_id),
                "created_at": _serialize_dt(lnk.created_at),
            })

        return json.dumps({"links": items, "total": len(items)}, ensure_ascii=False)
