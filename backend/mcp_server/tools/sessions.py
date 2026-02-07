"""Session and candidate management MCP tools."""
import json
import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from mcp_server.db import get_session
from app.models import (
    Session, SessionQuestionAnswer, SessionTranscript,
    SessionEvaluation, Interview, CandidateStatus, CandidateStatusType,
    SessionStatus,
)


def _serialize_uuid(val):
    return str(val) if val else None


def _serialize_dt(val):
    return val.isoformat() if val else None


async def list_sessions(
    interview_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> str:
    """List interview sessions with filters.

    Args:
        interview_id: Filter by interview template UUID
        status: Filter by status (pending/in_progress/completed/abandoned)
        limit: Max results (default 50)
        offset: Skip first N results
    """
    async with get_session() as db:
        query = (
            select(Session)
            .options(
                selectinload(Session.interview),
                selectinload(Session.evaluation),
                selectinload(Session.candidate_status),
            )
            .order_by(Session.created_at.desc())
        )

        if interview_id:
            query = query.where(Session.interview_id == uuid.UUID(interview_id))
        if status:
            query = query.where(Session.status == SessionStatus(status))

        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        sessions = result.scalars().all()

        # Count
        count_q = select(func.count(Session.id))
        if interview_id:
            count_q = count_q.where(Session.interview_id == uuid.UUID(interview_id))
        if status:
            count_q = count_q.where(Session.status == SessionStatus(status))
        total = (await db.execute(count_q)).scalar()

        items = []
        for s in sessions:
            score = s.evaluation.overall_score if s.evaluation else None
            cand_status = s.candidate_status.status.value if s.candidate_status else None
            items.append({
                "id": _serialize_uuid(s.id),
                "interview_id": _serialize_uuid(s.interview_id),
                "position": s.interview.position if s.interview else None,
                "candidate_name": s.candidate_name,
                "candidate_email": s.candidate_email,
                "candidate_surname": s.candidate_surname,
                "status": s.status.value,
                "score": score,
                "candidate_status": cand_status,
                "started_at": _serialize_dt(s.started_at),
                "completed_at": _serialize_dt(s.completed_at),
                "created_at": _serialize_dt(s.created_at),
            })

        return json.dumps({"sessions": items, "total": total}, ensure_ascii=False)


async def get_session_details(session_id: str) -> str:
    """Get full session details with transcript, Q&A, and evaluation.

    Args:
        session_id: UUID of the session
    """
    async with get_session() as db:
        result = await db.execute(
            select(Session).options(
                selectinload(Session.interview).selectinload(Interview.questions),
                selectinload(Session.interview).selectinload(Interview.evaluation_criteria),
                selectinload(Session.question_answers),
                selectinload(Session.transcript_messages),
                selectinload(Session.evaluation).selectinload(SessionEvaluation.observations),
                selectinload(Session.evaluation).selectinload(SessionEvaluation.strengths),
                selectinload(Session.evaluation).selectinload(SessionEvaluation.improvements),
                selectinload(Session.evaluation).selectinload(SessionEvaluation.key_phrases),
                selectinload(Session.candidate_status),
            ).where(Session.id == uuid.UUID(session_id))
        )
        s = result.scalar_one_or_none()
        if not s:
            return json.dumps({"error": "Session not found"})

        # Transcript
        transcript = [
            {
                "role": t.role,
                "message": t.message_text,
                "timestamp": _serialize_dt(t.timestamp),
                "order": t.order_index,
            }
            for t in sorted(s.transcript_messages, key=lambda x: x.order_index)
        ]

        # Q&A
        qa_list = [
            {
                "id": _serialize_uuid(qa.id),
                "question": qa.question_text,
                "answer": qa.answer_text,
                "type": qa.question_type,
                "parent_id": _serialize_uuid(qa.parent_session_qa_id),
                "order": qa.order_index,
            }
            for qa in sorted(s.question_answers, key=lambda x: x.order_index)
        ]

        # Evaluation
        evaluation = None
        if s.evaluation:
            ev = s.evaluation
            evaluation = {
                "overall_score": ev.overall_score,
                "summary": ev.summary,
                "readiness": ev.readiness,
                "recommendation": ev.recommendation,
                "observations": [
                    {"category": o.category, "text": o.observation_text}
                    for o in ev.observations
                ],
                "strengths": [st.strength_text for st in sorted(ev.strengths, key=lambda x: x.order_index)],
                "improvements": [im.improvement_text for im in sorted(ev.improvements, key=lambda x: x.order_index)],
                "key_phrases": [
                    {"type": kp.phrase_type, "text": kp.phrase_text, "note": kp.note}
                    for kp in sorted(ev.key_phrases, key=lambda x: x.order_index)
                ],
            }

        # Interview info
        interview_info = None
        if s.interview:
            iv = s.interview
            interview_info = {
                "id": _serialize_uuid(iv.id),
                "title": iv.title,
                "position": iv.position,
                "company": iv.company,
                "duration": iv.duration,
                "questions_count": len([q for q in iv.questions if q.parent_question_id is None]),
                "criteria": [c.criterion_name for c in iv.evaluation_criteria],
            }

        data = {
            "id": _serialize_uuid(s.id),
            "candidate_name": s.candidate_name,
            "candidate_email": s.candidate_email,
            "candidate_surname": s.candidate_surname,
            "status": s.status.value,
            "candidate_hr_status": s.candidate_status.status.value if s.candidate_status else None,
            "hr_notes": s.candidate_status.notes if s.candidate_status else None,
            "started_at": _serialize_dt(s.started_at),
            "completed_at": _serialize_dt(s.completed_at),
            "interview": interview_info,
            "transcript": transcript,
            "question_answers": qa_list,
            "evaluation": evaluation,
        }
        return json.dumps(data, ensure_ascii=False)


async def get_session_transcript(session_id: str) -> str:
    """Get just the transcript messages for a session.

    Args:
        session_id: UUID of the session
    """
    async with get_session() as db:
        result = await db.execute(
            select(SessionTranscript)
            .where(SessionTranscript.session_id == uuid.UUID(session_id))
            .order_by(SessionTranscript.order_index)
        )
        messages = result.scalars().all()

        transcript = [
            {
                "role": m.role,
                "message": m.message_text,
                "timestamp": _serialize_dt(m.timestamp),
            }
            for m in messages
        ]
        return json.dumps({"session_id": session_id, "transcript": transcript}, ensure_ascii=False)


async def update_candidate_status(
    session_id: str,
    status: str,
    notes: Optional[str] = None,
) -> str:
    """Update candidate HR status for a session.

    Args:
        session_id: UUID of the session
        status: New status (new/reviewed/shortlisted/rejected)
        notes: HR notes about the candidate
    """
    async with get_session() as db:
        sid = uuid.UUID(session_id)

        # Check session exists
        sess = await db.execute(select(Session).where(Session.id == sid))
        if not sess.scalar_one_or_none():
            return json.dumps({"error": "Session not found"})

        result = await db.execute(
            select(CandidateStatus).where(CandidateStatus.session_id == sid)
        )
        cs = result.scalar_one_or_none()

        new_status = CandidateStatusType(status)

        if cs:
            cs.status = new_status
            if notes is not None:
                cs.notes = notes
        else:
            cs = CandidateStatus(
                session_id=sid,
                status=new_status,
                notes=notes,
            )
            db.add(cs)

        return json.dumps({
            "session_id": session_id,
            "status": status,
            "notes": notes,
            "result": "updated",
        })
