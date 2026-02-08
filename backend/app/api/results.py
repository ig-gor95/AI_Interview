"""Results API routes"""
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, exists, case
from sqlalchemy.orm import selectinload
from typing import Optional, List
import uuid

from app.database import get_db
from app.models.user import User
from app.models.interview import Interview
from app.models.session import (
    Session,
    SessionStatus,
    SessionEvaluation,
    SessionTranscript,
    SessionEvaluationCriterionResult,
)
from app.models.simulation import SimulationScenario, SimulationDialog
from app.core import openai_service
from app.services.evaluation_service import generate_evaluation_from_transcript
from app.services.audio_service import AudioService
from app.utils.auth import get_current_organizer, get_current_user
from app.schemas.result import (
    SessionResult,
    CandidateStatisticsResponse,
    CandidateListResponse,
    CandidateListItemResponse,
    CandidateDetailResponse,
    QualityRating,
    RecommendationStatus
)
from app.schemas.interview import TranscriptMessage

router = APIRouter()


# Helper functions
def score_to_quality_rating(score: int) -> QualityRating:
    """Convert numeric score (0-100) to quality rating"""
    if score >= 85:
        return 'outstanding'
    elif score >= 70:
        return 'strong'
    elif score >= 55:
        return 'promising'
    else:
        return 'suitable'


def get_recommendation_status(score: Optional[int]) -> RecommendationStatus:
    """Calculate recommendation status from score"""
    if score is None:
        return 'not-recommended'
    
    # Convert score to numeric rating (0-10 scale)
    numeric_rating = score / 10.0
    
    if numeric_rating >= 7.5:
        return 'recommended'
    elif numeric_rating >= 5.0:
        return 'questionable'
    else:
        return 'not-recommended'


@router.get("/statistics", response_model=CandidateStatisticsResponse)
async def get_statistics(
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregate statistics for organizer"""
    try:
        # Count total interviews for organizer
        interviews_result = await db.execute(
            select(func.count(Interview.id))
            .where(Interview.organizer_id == current_user.id)
            .where(Interview.is_active == True)
        )
        total_interviews = interviews_result.scalar() or 0
        
        # Count completed sessions for organizer's interviews
        completed_sessions_result = await db.execute(
            select(func.count(Session.id))
            .join(Interview, Session.interview_id == Interview.id)
            .where(Interview.organizer_id == current_user.id)
            .where(Session.status == SessionStatus.COMPLETED)
        )
        completed_candidates = completed_sessions_result.scalar() or 0
        
        # Calculate recommended percentage (sessions with score >= 75)
        if completed_candidates > 0:
            recommended_result = await db.execute(
                select(func.count(SessionEvaluation.id))
                .join(Session, SessionEvaluation.session_id == Session.id)
                .join(Interview, Session.interview_id == Interview.id)
                .where(Interview.organizer_id == current_user.id)
                .where(Session.status == SessionStatus.COMPLETED)
                .where(SessionEvaluation.overall_score >= 75)
            )
            recommended_count = recommended_result.scalar() or 0
            recommended_percentage = round((recommended_count / completed_candidates) * 100)
        else:
            recommended_percentage = 0
        
        return CandidateStatisticsResponse(
            totalInterviews=total_interviews,
            completedCandidates=completed_candidates,
            recommendedPercentage=recommended_percentage
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")


@router.get("/candidates", response_model=CandidateListResponse)
async def get_candidates(
    interview_id: Optional[str] = Query(None, description="Filter by interview template ID"),
    status: Optional[str] = Query(None, description="Filter by recommendation status: recommended/questionable/not-recommended"),
    min_rating: Optional[float] = Query(None, description="Minimum rating filter (0-10)"),
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get lightweight list of candidates for organizer (no transcript data)"""
    try:
        # Subquery: sessions that have at least one transcript message
        has_transcript = exists().where(SessionTranscript.session_id == Session.id)
        
        # Base query: sessions with transcript, no transcript loading
        query = (
            select(Session)
            .join(Interview, Session.interview_id == Interview.id)
            .where(Interview.organizer_id == current_user.id)
            .where(Session.status.in_([SessionStatus.COMPLETED, SessionStatus.IN_PROGRESS]))
            .where(has_transcript)
            .options(
                selectinload(Session.evaluation),
                selectinload(Session.interview)
            )
        )
        
        if interview_id:
            try:
                interview_uuid = uuid.UUID(interview_id)
                query = query.where(Session.interview_id == interview_uuid)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid interview_id format")
        
        result = await db.execute(query)
        sessions = result.scalars().unique().all()
        
        if not sessions:
            return CandidateListResponse(results=[], total=0)
        
        # Get transcript counts in one query (session_id, total_count, user_count)
        session_ids = [s.id for s in sessions]
        counts_stmt = (
            select(
                SessionTranscript.session_id,
                func.count(SessionTranscript.id).label("total_count"),
                func.sum(case((SessionTranscript.role == "user", 1), else_=0)).label("user_count")
            )
            .where(SessionTranscript.session_id.in_(session_ids))
            .group_by(SessionTranscript.session_id)
        )
        counts_result = await db.execute(counts_stmt)
        counts_map = {row.session_id: {"total": row.total_count, "user": row.user_count or 0} for row in counts_result}
        
        results_list = []
        for session in sessions:
            evaluation = session.evaluation
            score = evaluation.overall_score if evaluation else None
            
            if status:
                if score is None:
                    if status != "not-recommended":
                        continue
                else:
                    rec_status = get_recommendation_status(score)
                    if rec_status != status:
                        continue
            
            if min_rating is not None and score is not None:
                numeric_rating = score / 10.0
                if numeric_rating < min_rating:
                    continue
            
            quality_rating = score_to_quality_rating(score) if score else None
            rec_status = get_recommendation_status(score)
            counts = counts_map.get(session.id, {"total": 0, "user": 0})
            
            # Use startedAt as fallback for completedAt when session is in progress
            completed_at = session.completed_at or session.started_at or session.created_at
            position = None
            if session.interview:
                position = getattr(session.interview, "position", None) or getattr(session.interview, "title", None)
            results_list.append(CandidateListItemResponse(
                id=str(evaluation.id) if evaluation else str(session.id),
                sessionId=str(session.id),
                studentId=str(session.candidate_id) if session.candidate_id else None,
                studentName=session.candidate_name,
                studentEmail=session.candidate_email,
                startedAt=session.started_at or session.created_at,
                completedAt=completed_at,
                score=score,
                qualityRating=quality_rating,
                summary=evaluation.summary if evaluation else None,
                recommendationStatus=rec_status,
                transcriptCount=counts["total"],
                userMessageCount=counts["user"],
                position=position
            ))
        
        return CandidateListResponse(results=results_list, total=len(results_list))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching candidates: {str(e)}")


@router.get("/candidates/{session_id}")
async def get_candidate_detail(
    session_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed evaluation for a specific candidate session"""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")
    
    try:
        # Get session with all relationships
        result = await db.execute(
            select(Session)
            .join(Interview, Session.interview_id == Interview.id)
            .where(Session.id == session_uuid)
            .where(Interview.organizer_id == current_user.id)
            .options(
                selectinload(Session.evaluation).selectinload(SessionEvaluation.strengths),
                selectinload(Session.evaluation).selectinload(SessionEvaluation.improvements),
                selectinload(Session.evaluation).selectinload(SessionEvaluation.key_phrases),
                selectinload(Session.evaluation).selectinload(SessionEvaluation.observations),
                selectinload(Session.evaluation).selectinload(SessionEvaluation.criterion_results).selectinload(SessionEvaluationCriterionResult.criterion),
                selectinload(Session.transcript_messages),
                selectinload(Session.interview).selectinload(Interview.config),
                selectinload(Session.interview).selectinload(Interview.questions),
                selectinload(Session.interview).selectinload(Interview.evaluation_criteria),
                selectinload(Session.simulation_scenario).selectinload(SimulationScenario.dialog)
            )
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        transcript_messages = sorted(
            getattr(session, "transcript_messages", None) or [],
            key=lambda x: getattr(x, "order_index", 0)
        )
        if not transcript_messages:
            raise HTTPException(status_code=404, detail="No transcript found for this session")
        
        evaluation = session.evaluation
        evaluation_details = None
        if not evaluation:
            try:
                evaluation_details = await generate_evaluation_from_transcript(
                    session=session,
                    db=db,
                    ai_service=openai_service,
                )
                score = evaluation_details.get("overall_score")
                quality_rating = score_to_quality_rating(score) if score is not None else None
            except ValueError as ve:
                raise HTTPException(status_code=400, detail=str(ve))
            except Exception as gen_err:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate evaluation: {str(gen_err)}"
                )
        else:
            criterion_results_list = []
            for cr in getattr(evaluation, "criterion_results", []) or []:
                criterion = getattr(cr, "criterion", None)
                criterion_name = criterion.criterion_name if criterion else ""
                criterion_results_list.append({
                    "criterionId": str(cr.criterion_id),
                    "criterionName": criterion_name,
                    "passes": cr.passes,
                    "fact": cr.fact,
                    "justification": cr.justification,
                    "score": cr.score,
                })
            evaluation_details = {
                "id": str(evaluation.id),
                "overall_score": evaluation.overall_score,
                "summary": evaluation.summary,
                "readiness": evaluation.readiness,
                "recommendation": evaluation.recommendation,
                "strengths": [s.strength_text for s in sorted(evaluation.strengths, key=lambda x: x.order_index)],
                "improvements": [i.improvement_text for i in sorted(evaluation.improvements, key=lambda x: x.order_index)],
                "key_phrases": [
                    {"type": kp.phrase_type, "text": kp.phrase_text, "note": kp.note}
                    for kp in sorted(evaluation.key_phrases, key=lambda x: x.order_index)
                ],
                "observations": [
                    {"category": obs.category, "text": obs.observation_text}
                    for obs in evaluation.observations
                ],
                "criterion_results": criterion_results_list,
            }
            score = evaluation.overall_score
            quality_rating = score_to_quality_rating(score)
        
        if not evaluation_details:
            raise HTTPException(status_code=500, detail="Could not load or generate evaluation")
        
        def _dt_iso(dt):
            return dt.isoformat() if dt else None

        transcript_data = [
            {
                "role": msg.role,
                "message": msg.message_text,
                "timestamp": _dt_iso(msg.timestamp),
                "audioUrl": msg.audio_chunk_url,
            }
            for msg in transcript_messages
        ]

        started_dt = session.started_at or session.created_at
        completed_dt = session.completed_at or started_dt

        result_data = {
            "id": str(evaluation_details.get("id", session.id)),
            "sessionId": str(session.id),
            "studentId": str(session.candidate_id) if session.candidate_id else None,
            "studentName": session.candidate_name,
            "studentEmail": session.candidate_email,
            "startedAt": _dt_iso(started_dt),
            "completedAt": _dt_iso(completed_dt),
            "transcript": transcript_data,
            "summary": evaluation_details.get("summary"),
            "score": evaluation_details.get("overall_score"),
            "qualityRating": quality_rating,
        }

        interview_info = None
        if interview := getattr(session, "interview", None):
            parent_qs = [q for q in (getattr(interview, "questions", None) or []) if not getattr(q, "parent_question_id", None)]
            parent_qs.sort(key=lambda x: getattr(x, "order_index", 0))
            eval_criteria = getattr(interview, "evaluation_criteria", None) or []
            interview_info = {
                "position": getattr(interview, "position", None) or "",
                "company": getattr(interview, "company", None),
                "questions": [getattr(q, "question_text", "") for q in parent_qs],
                "evaluation_criteria": [
                    {
                        "id": str(ec.id),
                        "criterion_name": ec.criterion_name,
                        "is_required": getattr(ec, "is_required", True),
                    }
                    for ec in eval_criteria
                ],
            }

        simulation_info = None
        if scenario := getattr(session, "simulation_scenario", None):
            dialog_items = sorted(getattr(scenario, "dialog", None) or [], key=lambda d: getattr(d, "order_index", 0))
            simulation_info = {
                "scenarioDescription": getattr(scenario, "scenario_description", None) or "",
                "clientRole": getattr(scenario, "client_role", None) or "",
                "dialog": [
                    {
                        "role": getattr(d, "role", "ai"),
                        "message": getattr(d, "message_text", ""),
                        "tone": getattr(d, "tone", None),
                    }
                    for d in dialog_items
                ],
                "observations": evaluation_details.get("observations") or [],
            }

        payload = {
            "result": result_data,
            "evaluation": evaluation_details,
            "interview": interview_info,
            "simulation": simulation_info,
        }
        return JSONResponse(content=payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching candidate detail: {str(e)}")


@router.get("", response_model=List[CandidateListItemResponse])
async def get_results(
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get all results for current organizer (returns lightweight list for frontend)"""
    candidates_response = await get_candidates(current_user=current_user, db=db)
    return candidates_response.results


@router.get("/{result_id}")
async def get_result(
    result_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get result by evaluation ID (legacy endpoint)"""
    try:
        eval_uuid = uuid.UUID(result_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid result_id format")
    
    try:
        # Try to find by evaluation ID first
        result = await db.execute(
            select(SessionEvaluation)
            .join(Session, SessionEvaluation.session_id == Session.id)
            .join(Interview, Session.interview_id == Interview.id)
            .where(SessionEvaluation.id == eval_uuid)
            .where(Interview.organizer_id == current_user.id)
            .options(
                selectinload(SessionEvaluation.session).selectinload(Session.transcript_messages),
                selectinload(SessionEvaluation.session).selectinload(Session.interview)
            )
        )
        evaluation = result.scalar_one_or_none()
        
        if evaluation:
            session = evaluation.session
            return await get_candidate_detail(str(session.id), current_user=current_user, db=db)
        else:
            raise HTTPException(status_code=404, detail="Result not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching result: {str(e)}")


@router.get("/{result_id}/audio")
async def get_result_audio(
    result_id: str,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db)
):
    """Get audio file for result"""
    # TODO: Implement audio file serving
    return {"message": f"Audio for result {result_id} - to be implemented"}


@router.get("/audio/{interview_id}/{filename}")
async def get_audio_file(
    interview_id: str,
    filename: str,
    audio_service: AudioService = Depends(lambda: AudioService())
):
    """Get audio file by interview ID and filename"""
    try:
        audio_data = await audio_service.get_audio(interview_id, filename)
        if audio_data is None:
            raise HTTPException(status_code=404, detail="Audio file not found")

        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"inline; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving audio file: {str(e)}")
