"""Background evaluation service for generating interview assessments asynchronously."""
import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.session import Session, EvaluationStatus
from app.models.interview import Interview


async def run_evaluation_background(session_id: str):
    """
    Background task for generating evaluation via GPT (non-blocking).

    This function creates its own database session and can be safely called
    from both websocket handlers and API endpoints via asyncio.create_task().

    Args:
        session_id: UUID string of the session to evaluate
    """
    from app.database import AsyncSessionLocal
    from app.core import openai_service
    from app.services.evaluation_service import generate_evaluation_from_transcript

    print(f"[BackgroundEval] Starting background evaluation for session {session_id}")
    async with AsyncSessionLocal() as bg_db:
        try:
            result = await bg_db.execute(
                select(Session)
                .where(Session.id == uuid.UUID(session_id))
                .options(
                    selectinload(Session.transcript_messages),
                    selectinload(Session.interview).selectinload(Interview.config),
                    selectinload(Session.interview).selectinload(Interview.questions),
                    selectinload(Session.interview).selectinload(Interview.evaluation_criteria)
                )
            )
            session_for_eval = result.scalar_one_or_none()
            if not session_for_eval:
                print(f"[BackgroundEval] Session {session_id} not found, skipping evaluation")
                return

            transcript_count = len(session_for_eval.transcript_messages) if session_for_eval.transcript_messages else 0
            print(f"[BackgroundEval] Session loaded, transcript_messages count={transcript_count}")

            # Set evaluation status to IN_PROGRESS
            session_for_eval.evaluation_status = EvaluationStatus.IN_PROGRESS
            await bg_db.commit()

            # Explicitly load all relationships into memory to avoid lazy loading issues
            # This is critical to prevent "greenlet_spawn has not been called" errors
            try:
                # Explicitly access relationships to load them into memory
                # This must be done in the same async context where the query was executed
                transcript_messages_list = session_for_eval.transcript_messages
                if not transcript_messages_list:
                    print(f"[BackgroundEval] No transcript for session {session_id}, skipping evaluation (session may have just ended and transcript not yet committed)")
                    session_for_eval.evaluation_status = EvaluationStatus.FAILED
                    await bg_db.commit()
                    return

                # Convert to list to load all items into memory
                transcript_messages = list(transcript_messages_list)

                # Explicitly load all interview data into memory
                interview = session_for_eval.interview
                if interview:
                    # Explicitly access relationships to load them into memory
                    config = interview.config
                    questions_list = list(interview.questions or [])
                    criteria_list = list(interview.evaluation_criteria or [])
                    # Ensure all data is loaded by accessing their attributes
                    for q in questions_list:
                        _ = q.question_text
                    for c in criteria_list:
                        _ = c.criterion_name

                # Now all data is loaded into memory, safe to use the object
                print(f"[BackgroundEval] Calling generate_evaluation_from_transcript for session {session_id}")
                result = await generate_evaluation_from_transcript(
                    session=session_for_eval,
                    db=bg_db,
                    ai_service=openai_service,
                )

                # Если GPT вернул невалидный JSON — подставился fallback с "Evaluation incomplete". Не считаем успехом.
                cr_list = result.get("criterion_results") or []
                if cr_list and all((c.get("justification") or "").strip() == "Evaluation incomplete" for c in cr_list):
                    from app.models.session import SessionEvaluation
                    eval_id = result.get("id")
                    if eval_id:
                        try:
                            eval_uuid = uuid.UUID(eval_id)
                            eval_obj = await bg_db.get(SessionEvaluation, eval_uuid)
                            if eval_obj:
                                await bg_db.delete(eval_obj)
                        except Exception as del_err:
                            print(f"[BackgroundEval] Could not delete incomplete evaluation: {del_err}")
                    session_for_eval.evaluation_status = EvaluationStatus.FAILED
                    await bg_db.commit()
                    print(f"[BackgroundEval] GPT returned invalid JSON (fallback); marked session {session_id} as FAILED, removed incomplete evaluation. User can retry from card.")
                    return

                # Set evaluation status to COMPLETED on success
                session_for_eval.evaluation_status = EvaluationStatus.COMPLETED
                await bg_db.commit()
                print(f"[BackgroundEval] Evaluation generated successfully for session {session_id} (summary and criterion_results saved)")

            except Exception as eval_err:
                # If an error occurred while loading data, log and skip
                print(f"[BackgroundEval] Error loading session data for evaluation: {eval_err}")
                import traceback
                traceback.print_exc()

                # Set evaluation status to FAILED on error
                session_for_eval.evaluation_status = EvaluationStatus.FAILED
                await bg_db.commit()
                raise

        except Exception as e:
            print(f"[BackgroundEval] Error in background evaluation for session {session_id}: {e}")
            import traceback
            traceback.print_exc()
