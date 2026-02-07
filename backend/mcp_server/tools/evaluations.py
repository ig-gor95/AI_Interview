"""Evaluation and reporting MCP tools."""
import json
import uuid
from typing import Optional

from sqlalchemy import select, func, case, and_
from sqlalchemy.orm import selectinload

from mcp_server.db import get_session
from app.models import (
    Session, SessionEvaluation, SessionEvaluationObservation,
    SessionEvaluationStrength, SessionEvaluationImprovement,
    SessionEvaluationKeyPhrase, Interview, CandidateStatus,
    CandidateStatusType, SessionStatus, SessionTranscript,
)


def _serialize_uuid(val):
    return str(val) if val else None


def _serialize_dt(val):
    return val.isoformat() if val else None


def _quality_rating(score: int) -> str:
    if score >= 85:
        return "outstanding"
    elif score >= 71:
        return "strong"
    elif score >= 51:
        return "promising"
    return "suitable"


def _recommendation_status(score: int) -> str:
    if score >= 71:
        return "recommended"
    elif score >= 51:
        return "questionable"
    return "not-recommended"


async def get_evaluation(session_id: str) -> str:
    """Get full evaluation report for a completed session.

    Args:
        session_id: UUID of the session
    """
    async with get_session() as db:
        result = await db.execute(
            select(SessionEvaluation).options(
                selectinload(SessionEvaluation.observations),
                selectinload(SessionEvaluation.strengths),
                selectinload(SessionEvaluation.improvements),
                selectinload(SessionEvaluation.key_phrases),
            ).where(SessionEvaluation.session_id == uuid.UUID(session_id))
        )
        ev = result.scalar_one_or_none()
        if not ev:
            return json.dumps({"error": "Evaluation not found for this session"})

        data = {
            "session_id": session_id,
            "overall_score": ev.overall_score,
            "quality_rating": _quality_rating(ev.overall_score),
            "recommendation": ev.recommendation,
            "recommendation_status": _recommendation_status(ev.overall_score),
            "summary": ev.summary,
            "readiness": ev.readiness,
            "observations": [
                {"category": o.category, "text": o.observation_text}
                for o in ev.observations
            ],
            "strengths": [
                s.strength_text
                for s in sorted(ev.strengths, key=lambda x: x.order_index)
            ],
            "improvements": [
                im.improvement_text
                for im in sorted(ev.improvements, key=lambda x: x.order_index)
            ],
            "key_phrases": {
                "effective": [
                    {"text": kp.phrase_text, "note": kp.note}
                    for kp in ev.key_phrases if kp.phrase_type == "effective"
                ],
                "to_improve": [
                    {"text": kp.phrase_text, "note": kp.note}
                    for kp in ev.key_phrases if kp.phrase_type == "to_improve"
                ],
            },
            "created_at": _serialize_dt(ev.created_at),
        }
        return json.dumps(data, ensure_ascii=False)


async def get_candidates_summary(
    interview_id: Optional[str] = None,
    min_score: Optional[int] = None,
    max_score: Optional[int] = None,
    candidate_status: Optional[str] = None,
    recommendation: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> str:
    """Get candidates list with scores and filters for recruiter dashboard.

    Args:
        interview_id: Filter by interview template UUID
        min_score: Minimum evaluation score (0-100)
        max_score: Maximum evaluation score (0-100)
        candidate_status: Filter by HR status (new/reviewed/shortlisted/rejected)
        recommendation: Filter by recommendation (recommended/questionable/not-recommended)
        limit: Max results
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
            .where(Session.status == SessionStatus.COMPLETED)
            .order_by(Session.completed_at.desc())
        )

        if interview_id:
            query = query.where(Session.interview_id == uuid.UUID(interview_id))

        result = await db.execute(query.limit(limit).offset(offset))
        sessions = result.scalars().all()

        items = []
        for s in sessions:
            score = s.evaluation.overall_score if s.evaluation else None

            # Apply score filters
            if score is not None:
                if min_score is not None and score < min_score:
                    continue
                if max_score is not None and score > max_score:
                    continue
                rec = _recommendation_status(score)
                if recommendation and rec != recommendation:
                    continue

            # Apply candidate status filter
            cs = s.candidate_status
            if candidate_status:
                cs_val = cs.status.value if cs else "new"
                if cs_val != candidate_status:
                    continue

            items.append({
                "session_id": _serialize_uuid(s.id),
                "candidate_name": s.candidate_name,
                "candidate_email": s.candidate_email,
                "candidate_surname": s.candidate_surname,
                "position": s.interview.position if s.interview else None,
                "company": s.interview.company if s.interview else None,
                "score": score,
                "quality_rating": _quality_rating(score) if score else None,
                "recommendation_status": _recommendation_status(score) if score else None,
                "summary": s.evaluation.summary if s.evaluation else None,
                "candidate_status": cs.status.value if cs else "new",
                "hr_notes": cs.notes if cs else None,
                "started_at": _serialize_dt(s.started_at),
                "completed_at": _serialize_dt(s.completed_at),
            })

        return json.dumps({
            "candidates": items,
            "total": len(items),
        }, ensure_ascii=False)


async def get_interview_statistics(interview_id: Optional[str] = None) -> str:
    """Get aggregate statistics for interviews.

    Args:
        interview_id: Optional UUID to get stats for specific interview. If null, returns global stats.
    """
    async with get_session() as db:
        # Base query for completed sessions with evaluations
        base_filter = Session.status == SessionStatus.COMPLETED

        if interview_id:
            base_filter = and_(base_filter, Session.interview_id == uuid.UUID(interview_id))

        # Total sessions by status
        status_q = select(
            Session.status, func.count(Session.id)
        ).group_by(Session.status)
        if interview_id:
            status_q = status_q.where(Session.interview_id == uuid.UUID(interview_id))
        status_result = await db.execute(status_q)
        status_counts = {row[0].value: row[1] for row in status_result.all()}

        # Score stats for completed sessions
        score_q = (
            select(
                func.count(SessionEvaluation.id),
                func.avg(SessionEvaluation.overall_score),
                func.min(SessionEvaluation.overall_score),
                func.max(SessionEvaluation.overall_score),
            )
            .join(Session, Session.id == SessionEvaluation.session_id)
            .where(base_filter)
        )
        score_result = await db.execute(score_q)
        score_row = score_result.one()

        total_evaluated = score_row[0] or 0
        avg_score = round(float(score_row[1]), 1) if score_row[1] else None
        min_score = score_row[2]
        max_score = score_row[3]

        # Recommendation breakdown
        recommended = 0
        questionable = 0
        not_recommended = 0
        if total_evaluated > 0:
            scores_q = (
                select(SessionEvaluation.overall_score)
                .join(Session, Session.id == SessionEvaluation.session_id)
                .where(base_filter)
            )
            scores_result = await db.execute(scores_q)
            for (sc,) in scores_result.all():
                if sc >= 71:
                    recommended += 1
                elif sc >= 51:
                    questionable += 1
                else:
                    not_recommended += 1

        # Total interviews count
        interviews_count = 0
        if not interview_id:
            ic = await db.execute(select(func.count(Interview.id)).where(Interview.is_active == True))
            interviews_count = ic.scalar()

        data = {
            "interview_id": interview_id,
            "total_active_interviews": interviews_count if not interview_id else None,
            "sessions_by_status": status_counts,
            "total_evaluated": total_evaluated,
            "scores": {
                "average": avg_score,
                "min": min_score,
                "max": max_score,
            },
            "recommendations": {
                "recommended": recommended,
                "questionable": questionable,
                "not_recommended": not_recommended,
                "recommended_percentage": round(recommended / total_evaluated * 100) if total_evaluated else 0,
            },
        }
        return json.dumps(data, ensure_ascii=False)
