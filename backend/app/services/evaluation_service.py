"""Evaluation service coordinating all analyzers"""
import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.analyzers.registry import AnalyzerRegistry
from app.analyzers.base import AnalysisResult
from app.config import settings
from app.models.session import (
    Session,
    SessionEvaluation,
    SessionEvaluationStrength,
    SessionEvaluationImprovement,
    SessionEvaluationKeyPhrase,
    SessionEvaluationObservation,
)


class EvaluationService:
    """Service for coordinating interview evaluation using multiple analyzers"""
    
    def __init__(self, analyzer_registry: AnalyzerRegistry):
        self.registry = analyzer_registry
        # Default weights - can be overridden from settings
        self.weights = {
            "pronunciation_alphabet": settings.pronunciation_weight,
            "clarity_analyzer": settings.clarity_weight,
            "gpt_content_analyzer": settings.gpt_content_weight,
            "stress_handling_analyzer": settings.stress_handling_weight,
        }
    
    async def evaluate_interview(
        self,
        interview_id: str,
        audio_data: Optional[bytes],
        transcript: List[Dict[str, Any]],
        metadata: Dict[str, Any],
        enabled_analyzers: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate interview using all enabled analyzers
        
        Args:
            interview_id: ID of the interview
            audio_data: Raw audio bytes
            transcript: Interview transcript
            metadata: Additional metadata
            enabled_analyzers: List of analyzer names to use (uses config if None)
            
        Returns:
            Aggregated evaluation results
        """
        # Get enabled analyzers
        if enabled_analyzers is None:
            enabled_analyzers = settings.enabled_analyzers_list
        
        analyzers = self.registry.get_analyzers(enabled_analyzers)
        
        if not analyzers:
            raise ValueError("No analyzers available for evaluation")
        
        # Run all analyzers in parallel
        tasks = [
            analyzer.analyze(audio_data, transcript, metadata)
            for analyzer in analyzers
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and log them
        valid_results = []
        errors = []
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                errors.append({
                    "analyzer": analyzers[i].name,
                    "error": str(result)
                })
            else:
                valid_results.append(result)
        
        # Aggregate results
        aggregated = self._aggregate_results(valid_results)
        
        return {
            "interview_id": interview_id,
            "overall_score": aggregated["overall_score"],
            "analyzer_results": [
                {
                    "name": r.analyzer_name,
                    "score": r.score,
                    "details": r.details,
                    "recommendations": r.recommendations,
                }
                for r in valid_results
            ],
            "aggregated_details": aggregated["details"],
            "all_recommendations": aggregated["recommendations"],
            "errors": errors if errors else None,
        }
    
    def _aggregate_results(self, results: List[AnalysisResult]) -> Dict[str, Any]:
        """Aggregate multiple analyzer results into final score"""
        if not results:
            return {
                "overall_score": 0.0,
                "details": {},
                "recommendations": [],
            }
        
        # Calculate weighted average
        total_weight = 0.0
        weighted_sum = 0.0
        
        for result in results:
            weight = self.weights.get(result.analyzer_name, 1.0)
            weighted_sum += result.score * weight
            total_weight += weight
        
        overall_score = weighted_sum / total_weight if total_weight > 0 else 0.0
        
        # Collect all recommendations
        all_recommendations = []
        for result in results:
            all_recommendations.extend(result.recommendations)
        
        # Aggregate details
        aggregated_details = {
            "analyzers_used": len(results),
            "analyzer_names": [r.analyzer_name for r in results],
        }
        
        return {
            "overall_score": round(overall_score, 2),
            "details": aggregated_details,
            "recommendations": list(set(all_recommendations)),  # Remove duplicates
        }


async def generate_evaluation_from_transcript(
    session: Session,
    db: AsyncSession,
    ai_service: Any,
) -> Dict[str, Any]:
    """
    Generate evaluation from interview transcript using GPT/DeepSeek.
    Saves to SessionEvaluation and related tables, returns evaluation dict.
    
    Args:
        session: Session with transcript_messages and interview loaded
        db: Async database session
        ai_service: AIService instance (openai_service) with analyze_transcript method
        
    Returns:
        Evaluation dict for API response
    """
    # Извлечь session_id сразу, чтобы избежать проблем с lazy loading
    try:
        session_id = session.id
    except AttributeError:
        raise ValueError("Session has no ID")
    
    # Извлечь transcript_messages - использовать прямой доступ к атрибуту
    try:
        transcript_messages_list = list(session.transcript_messages) if session.transcript_messages else []
    except AttributeError:
        transcript_messages_list = []
    
    transcript_messages = sorted(
        transcript_messages_list,
        key=lambda x: getattr(x, 'order_index', 0)
    )
    if not transcript_messages:
        raise ValueError("Session has no transcript messages")
    
    # Извлечь данные в простые структуры, избегая lazy loading
    transcript = []
    for m in transcript_messages:
        try:
            transcript.append({
                "role": getattr(m, 'role', 'unknown'),
                "message": getattr(m, 'message_text', str(m)),
            })
        except Exception:
            continue
    
    # Извлечь данные интервью в простые структуры
    try:
        interview = session.interview
    except AttributeError:
        interview = None
    
    session_params = {}
    criteria_from_template = []
    
    if interview:
        try:
            position = getattr(interview, 'position', None) or ""
            company = getattr(interview, 'company', None)
        except Exception:
            position = ""
            company = None
        
        session_params = {
            "position": position,
            "company": company,
            "goals": [],
            "questions": [],
            "evaluation_criteria": [],
        }
        
        try:
            config = interview.config
        except AttributeError:
            config = None
        
        if config:
            try:
                goals = getattr(config, 'goals', None)
                session_params["goals"] = goals if isinstance(goals, list) else []
                session_params["focus_areas"] = getattr(config, 'focus_areas', None) or []
                session_params["expected_knowledge"] = getattr(config, 'expected_knowledge', None) or []
                session_params["role_context"] = getattr(config, 'role_context', None) or ""
            except Exception:
                pass
        
        # Извлечь вопросы
        try:
            questions_rel = interview.questions
            questions_list = list(questions_rel) if questions_rel else []
        except (AttributeError, Exception):
            questions_list = []
        
        parent_qs = [q for q in questions_list if not getattr(q, 'parent_question_id', None)]
        parent_qs.sort(key=lambda x: getattr(x, 'order_index', 0))
        session_params["questions"] = [getattr(q, 'question_text', '') for q in parent_qs]
        
        # Извлечь критерии оценки из шаблона интервью
        try:
            criteria_rel = interview.evaluation_criteria
            criteria_objs = list(criteria_rel) if criteria_rel else []
        except (AttributeError, Exception):
            criteria_objs = []
        
        if criteria_objs:
            criteria_with_index = [
                (getattr(c, 'criterion_name', str(c)), getattr(c, 'order_index', 0)) 
                for c in criteria_objs
            ]
            criteria_with_index.sort(key=lambda x: x[1])
            criteria_from_template = [name for name, _ in criteria_with_index]
    
    # Использовать критерии из шаблона или дефолтные
    evaluation_criteria = criteria_from_template if criteria_from_template else ["communication", "relevance", "clarity", "professionalism"]
    if isinstance(evaluation_criteria, str):
        evaluation_criteria = [evaluation_criteria]
    
    gpt_result = await ai_service.analyze_transcript(
        transcript=transcript,
        session_params=session_params,
        evaluation_criteria=evaluation_criteria,
    )
    
    score = int(min(100, max(0, gpt_result.get("score", 50))))
    summary = gpt_result.get("summary") or ""
    readiness = gpt_result.get("readiness") or ""
    recommendation = gpt_result.get("recommendation") or ""
    
    eval_entity = SessionEvaluation(
        session_id=session_id,
        overall_score=score,
        summary=summary,
        readiness=readiness,
        recommendation=recommendation,
    )
    db.add(eval_entity)
    await db.flush()
    
    for i, s in enumerate(gpt_result.get("strengths") or []):
        db.add(SessionEvaluationStrength(
            evaluation_id=eval_entity.id,
            strength_text=str(s)[:2000],
            order_index=i,
        ))
    
    for i, imp in enumerate(gpt_result.get("improvements") or []):
        db.add(SessionEvaluationImprovement(
            evaluation_id=eval_entity.id,
            improvement_text=str(imp)[:2000],
            order_index=i,
        ))
    
    key_phrases = gpt_result.get("keyPhrases") or {}
    effective = key_phrases.get("effective") or []
    to_improve = key_phrases.get("toImprove") or []
    
    for i, item in enumerate(effective):
        d = item if isinstance(item, dict) else {"text": str(item), "note": ""}
        db.add(SessionEvaluationKeyPhrase(
            evaluation_id=eval_entity.id,
            phrase_type="effective",
            phrase_text=str(d.get("text", d))[:1000],
            note=str(d.get("note", ""))[:500] if d.get("note") else None,
            order_index=i,
        ))
    
    for i, item in enumerate(to_improve):
        d = item if isinstance(item, dict) else {"text": str(item), "note": ""}
        db.add(SessionEvaluationKeyPhrase(
            evaluation_id=eval_entity.id,
            phrase_type="to_improve",
            phrase_text=str(d.get("text", d))[:1000],
            note=str(d.get("note", ""))[:500] if d.get("note") else None,
            order_index=len(effective) + i,
        ))
    
    obs = gpt_result.get("observations") or {}
    for cat, text in obs.items():
        if text:
            db.add(SessionEvaluationObservation(
                evaluation_id=eval_entity.id,
                category=str(cat)[:100],
                observation_text=str(text)[:2000],
            ))
    
    # Сохранить оценки по критериям (из criterionScores)
    criterion_scores = gpt_result.get("criterionScores") or {}
    for criterion_name, score_data in criterion_scores.items():
        if isinstance(score_data, dict):
            score_val = score_data.get("score", 0)
            justification = score_data.get("justification", "")
            obs_text = f"Score: {score_val}. {justification}"[:2000]
        else:
            # Fallback: если пришло просто число
            score_val = int(score_data) if isinstance(score_data, (int, float)) else 0
            obs_text = f"Score: {score_val}"[:2000]
        db.add(SessionEvaluationObservation(
            evaluation_id=eval_entity.id,
            category=f"criterion_{criterion_name}"[:100],
            observation_text=obs_text,
        ))
    
    await db.commit()
    
    rec_status = "recommended" if score >= 75 else "questionable" if score >= 50 else "not-recommended"
    
    strengths_list = gpt_result.get("strengths") or []
    improvements_list = gpt_result.get("improvements") or []
    
    kp_effective = [
        {"type": "effective", "text": (x.get("text", x) if isinstance(x, dict) else str(x))[:500], "note": (x.get("note", "") if isinstance(x, dict) else "")[:200]}
        for x in (gpt_result.get("keyPhrases") or {}).get("effective") or []
    ]
    kp_to_improve = [
        {"type": "to_improve", "text": (x.get("text", x) if isinstance(x, dict) else str(x))[:500], "note": (x.get("note", "") if isinstance(x, dict) else "")[:200]}
        for x in (gpt_result.get("keyPhrases") or {}).get("toImprove") or []
    ]
    obs_list = [
        {"category": str(cat), "text": str(txt)[:500]}
        for cat, txt in (gpt_result.get("observations") or {}).items()
        if txt
    ]
    
    # Добавить оценки по критериям в ответ
    criterion_scores_list = []
    criterion_scores_raw = gpt_result.get("criterionScores") or {}
    for criterion_name, score_data in criterion_scores_raw.items():
        if isinstance(score_data, dict):
            criterion_scores_list.append({
                "criterion": criterion_name,
                "score": int(score_data.get("score", 0)),
                "justification": str(score_data.get("justification", ""))[:500]
            })
        else:
            criterion_scores_list.append({
                "criterion": criterion_name,
                "score": int(score_data) if isinstance(score_data, (int, float)) else 0,
                "justification": ""
            })
    
    return {
        "id": str(eval_entity.id),
        "overall_score": eval_entity.overall_score,
        "summary": eval_entity.summary,
        "readiness": eval_entity.readiness,
        "recommendation": eval_entity.recommendation,
        "strengths": [str(s)[:500] for s in strengths_list],
        "improvements": [str(i)[:500] for i in improvements_list],
        "key_phrases": kp_effective + kp_to_improve,
        "observations": obs_list,
        "criterion_scores": criterion_scores_list,
        "recommendation_status": rec_status,
    }

