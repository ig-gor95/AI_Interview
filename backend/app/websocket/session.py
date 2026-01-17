"""WebSocket handler for live interview session dialog"""
import json
import uuid
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from fastapi import WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.session import Session, SessionStatus, SessionTranscript, SessionQuestionAnswer
from app.models.interview import Interview, InterviewQuestion
from app.services.openai_service import OpenAIService
from app.services.audio_service import AudioService
from app.services.session_service import (
    save_session_question_answer,
    get_session_question_answer_summaries
)
from app.schemas.session import (
    GPTContextRequest,
    GPTResponse,
    InterviewContext,
    InterviewQuestionContext,
    UserResponse,
    RemainingTime,
    ConversationMessage,
    QuestionProgress,
    SessionQuestionAnswerSummary
)
from app.core import openai_service


class SessionWebSocketManager:
    """Manages WebSocket connections for interview sessions"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_states: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept WebSocket connection"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        
        # Initialize session state
        if session_id not in self.session_states:
            self.session_states[session_id] = {
                "transcript": [],
                "audio_chunks": [],
                "current_question_index": 0,
                "started": False,
                "last_question_qa_id": None,  # ID последнего SessionQuestionAnswer для вложенности
            }
    
    def disconnect(self, session_id: str):
        """Remove WebSocket connection"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.session_states:
            del self.session_states[session_id]
    
    async def send_message(self, session_id: str, message: Dict[str, Any]):
        """Send message to client"""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_json(message)
            except Exception as e:
                print(f"Error sending message to {session_id}: {e}")
                self.disconnect(session_id)
    
    async def receive_message(self, session_id: str) -> Dict[str, Any]:
        """Receive message from client"""
        if session_id not in self.active_connections:
            raise ValueError("No active connection")
        
        data = await self.active_connections[session_id].receive()
        
        if "text" in data:
            return json.loads(data["text"])
        elif "bytes" in data:
            return {"type": "audio", "data": data["bytes"]}
        else:
            return {}


# Global WebSocket manager instance
ws_manager = SessionWebSocketManager()


async def handle_session_websocket(
    websocket: WebSocket,
    session_id: str,
    candidate_name: Optional[str] = None,
    candidate_email: Optional[str] = None
):
    """
    WebSocket handler for interview session
    
    Message types:
    - start: Start interview session
    - audio: Audio chunk from user
    - text: Text message (fallback)
    - end: End interview session
    """
    # Create database session
    async with AsyncSessionLocal() as db:
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA, reason="Invalid session ID")
            return
        
        # Get session (concrete interview session with candidate)
        result = await db.execute(
            select(Session)
            .options(
                selectinload(Session.interview).selectinload(Interview.questions),
                selectinload(Session.interview).selectinload(Interview.config),
                selectinload(Session.interview).selectinload(Interview.evaluation_criteria),
                selectinload(Session.question_answers),
                selectinload(Session.transcript_messages)
            )
            .where(Session.id == session_uuid)
        )
        session = result.scalar_one_or_none()
        
        if not session:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Session not found")
            return
        
        # Get interview template
        interview = session.interview
        if not interview or not interview.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Interview template not found or inactive")
            return
        
        # Connect WebSocket
        await ws_manager.connect(websocket, session_id)
        
        # Initialize audio service
        audio_service = AudioService()
        
        try:
            # Send welcome message
            await ws_manager.send_message(session_id, {
                "type": "connected",
                "message": "Подключено к интервью",
                "session_id": session_id
            })
            
            # Main message loop
            while True:
                try:
                    # Receive message
                    data = await ws_manager.receive_message(session_id)
                    
                    message_type = data.get("type", "unknown")
                    
                    if message_type == "start":
                        await _handle_start_session(
                            session_id, session, interview, db, audio_service
                        )
                    
                    elif message_type == "audio":
                        await _handle_audio_chunk(
                            session_id, session, interview, data, db, audio_service
                        )
                    
                    elif message_type == "text":
                        await _handle_text_message(
                            session_id, session, interview, data, db, audio_service
                        )
                    
                    elif message_type == "end":
                        await _handle_end_session(
                            session_id, session, db
                        )
                        break
                    
                    else:
                        await ws_manager.send_message(session_id, {
                            "type": "error",
                            "message": f"Unknown message type: {message_type}"
                        })
                        
                except WebSocketDisconnect:
                    break
                except Exception as e:
                    print(f"Error handling message: {e}")
                    import traceback
                    traceback.print_exc()
                    await ws_manager.send_message(session_id, {
                        "type": "error",
                        "message": str(e)
                    })
        
        except WebSocketDisconnect:
            pass
        finally:
            # Cleanup
            ws_manager.disconnect(session_id)


async def _handle_start_session(
    session_id: str,
    session: Session,
    interview: Interview,
    db: AsyncSession,
    audio_service: AudioService
):
    """Handle session start"""
    # Update session status
    if session.status == SessionStatus.PENDING:
        session.status = SessionStatus.IN_PROGRESS
        session.started_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(session)
    
    # Get greeting from OpenAI using structured context
    context = await _build_gpt_context(session, interview, db)
    
    # Generate greeting question
    greeting_response = await openai_service.generate_session_question_structured(context)
    greeting_text = greeting_response.question.text
    
    # Generate audio for greeting
    audio_bytes = await openai_service.text_to_speech(
        text=greeting_text,
        language=interview.language.value
    )
    
    # Save audio chunk
    audio_path = await audio_service.save_audio(
        interview_id=session_id,
        audio_data=audio_bytes,
        filename=f"greeting_{datetime.now(timezone.utc).timestamp()}.mp3"
    )
    
    # Save transcript message
    ai_message = SessionTranscript(
        session_id=session.id,
        role="ai",
        message_text=greeting_text,
        timestamp=datetime.now(timezone.utc),
        audio_chunk_url=audio_path,
        order_index=0
    )
    db.add(ai_message)
    await db.commit()
    
    # Update session state
    session_state = ws_manager.session_states[session_id]
    session_state["started"] = True
    session_state["transcript"].append({
        "role": "ai",
        "message": greeting_text,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Send greeting to client
    await ws_manager.send_message(session_id, {
        "type": "message",
        "role": "ai",
        "message": greeting_text,
        "audio_url": audio_path,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": greeting_response.metadata.dict() if greeting_response.metadata else None
    })


async def _handle_audio_chunk(
    session_id: str,
    session: Session,
    interview: Interview,
    data: Dict[str, Any],
    db: AsyncSession,
    audio_service: AudioService
):
    """Handle audio chunk from user"""
    audio_data = data.get("data")
    if not audio_data:
        return
    
    # Transcribe audio using Whisper
    transcript_text = await openai_service.transcribe_audio(
        audio_data=audio_data,
        language=interview.language.value,
        filename="user_audio.webm"
    )
    
    if not transcript_text:
        await ws_manager.send_message(session_id, {
            "type": "error",
            "message": "Не удалось распознать речь. Попробуйте повторить."
        })
        return
    
    # Process user response
    await _process_user_response(
        session_id, session, interview, transcript_text, db, audio_service
    )


async def _handle_text_message(
    session_id: str,
    session: Session,
    interview: Interview,
    data: Dict[str, Any],
    db: AsyncSession,
    audio_service: AudioService
):
    """Handle text message (fallback)"""
    text = data.get("text", "")
    if not text:
        return
    
    # Process user response
    await _process_user_response(
        session_id, session, interview, text, db, audio_service
    )


async def _process_user_response(
    session_id: str,
    session: Session,
    interview: Interview,
    user_text: str,
    db: AsyncSession,
    audio_service: AudioService
):
    """Process user response and generate next question"""
    session_state = ws_manager.session_states[session_id]
    
    # Get current order index
    result = await db.execute(
        select(SessionTranscript)
        .where(SessionTranscript.session_id == session.id)
        .order_by(SessionTranscript.order_index.desc())
    )
    last_transcript = result.scalar_one_or_none()
    next_order_index = (last_transcript.order_index + 1) if last_transcript else 0
    
    # Save user message in transcript
    user_message = SessionTranscript(
        session_id=session.id,
        role="user",
        message_text=user_text,
        timestamp=datetime.now(timezone.utc),
        order_index=next_order_index
    )
    db.add(user_message)
    await db.commit()
    
    session_state["transcript"].append({
        "role": "user",
        "message": user_text,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Send confirmation to user
    await ws_manager.send_message(session_id, {
        "type": "transcription",
        "message": user_text,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Get last question-answer to determine parent for next question
    result = await db.execute(
        select(SessionQuestionAnswer)
        .where(SessionQuestionAnswer.session_id == session.id)
        .order_by(SessionQuestionAnswer.order_index.desc())
    )
    last_qa = result.scalar_one_or_none()
    
    # Save current question-answer pair
    # Determine question type based on last_qa
    question_type = "main"
    parent_qa_id = None
    
    if last_qa:
        if last_qa.question_type == "main":
            question_type = "clarifying"
            parent_qa_id = last_qa.id
        elif last_qa.question_type in ("clarifying", "dynamic"):
            # Can be either clarifying or dynamic
            question_type = "clarifying"  # Default, GPT can change it to dynamic
            parent_qa_id = last_qa.parent_session_qa_id or last_qa.id
    
    # For now, we'll save it after GPT generates the question
    # Here we need to get the question text from the last AI message
    result = await db.execute(
        select(SessionTranscript)
        .where(
            SessionTranscript.session_id == session.id,
            SessionTranscript.role == "ai"
        )
        .order_by(SessionTranscript.order_index.desc())
    )
    last_ai_message = result.scalar_one_or_none()
    last_question_text = last_ai_message.message_text if last_ai_message else "Приветствие"
    
    # Save question-answer
    qa = await save_session_question_answer(
        db=db,
        session_id=session.id,
        question_text=last_question_text,
        answer_text=user_text,
        question_type=question_type,
        parent_session_qa_id=parent_qa_id
    )
    
    # Build GPT context with user response
    context = await _build_gpt_context(session, interview, db, user_response_text=user_text)
    
    # Generate next question using structured GPT API
    gpt_response = await openai_service.generate_session_question_structured(context)
    
    next_question_text = gpt_response.question.text
    next_question_type = gpt_response.question.type
    
    # Determine parent for the next question
    next_parent_qa_id = None
    if gpt_response.question.parent_session_question_answer_id:
        try:
            next_parent_qa_id = uuid.UUID(gpt_response.question.parent_session_question_answer_id)
        except (ValueError, TypeError):
            pass
    
    if next_question_type == "dynamic" and not interview.config.allow_dynamic_questions:
        # Fallback to clarifying if dynamic questions not allowed
        next_question_type = "clarifying"
    
    # Save next question-answer (question asked by GPT)
    # We save it with empty answer for now, answer will be filled when user responds
    # Actually, we save question-answer pairs when user answers, so we should save the question now
    # But actually, we save QA pairs when we have both question and answer
    # So for now, we'll just save the answer we got, and when GPT asks next question,
    # we'll save that question with empty answer, then when user answers, we update it
    
    # For now, let's save the question as a QA with empty answer (will be updated)
    # Actually, better approach: save QAs only when we have both Q and A
    # So we save the current QA (last question + current answer) now
    # And save next QA (next question + empty answer) after user responds
    
    # Generate audio for AI response
    ai_audio_bytes = await openai_service.text_to_speech(
        text=next_question_text,
        language=interview.language.value
    )
    
    # Save audio
    ai_audio_path = await audio_service.save_audio(
        interview_id=session_id,
        audio_data=ai_audio_bytes,
        filename=f"ai_response_{datetime.now(timezone.utc).timestamp()}.mp3"
    )
    
    # Save AI message in transcript
    next_order_index += 1
    ai_message = SessionTranscript(
        session_id=session.id,
        role="ai",
        message_text=next_question_text,
        timestamp=datetime.now(timezone.utc),
        audio_chunk_url=ai_audio_path,
        order_index=next_order_index
    )
    db.add(ai_message)
    await db.commit()
    
    session_state["transcript"].append({
        "role": "ai",
        "message": next_question_text,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Update session state
    session_state["last_question_qa_id"] = qa.id
    
    # Send AI response to client
    await ws_manager.send_message(session_id, {
        "type": "message",
        "role": "ai",
        "message": next_question_text,
        "audio_url": ai_audio_path,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": gpt_response.metadata.dict() if gpt_response.metadata else None,
        "questionType": next_question_type
    })


async def _handle_end_session(
    session_id: str,
    session: Session,
    db: AsyncSession
):
    """Handle session end"""
    session.status = SessionStatus.COMPLETED
    session.completed_at = datetime.now(timezone.utc)
    await db.commit()
    
    await ws_manager.send_message(session_id, {
        "type": "ended",
        "message": "Интервью завершено",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


async def _build_gpt_context(
    session: Session,
    interview: Interview,
    db: AsyncSession,
    user_response_text: Optional[str] = None
) -> GPTContextRequest:
    """Build GPT context request from session and interview"""
    
    # Build interview context
    interview_context = InterviewContext(
        id=str(interview.id),
        topic=interview.title,
        position=interview.position or "",
        company=interview.company,
        language=interview.language.value,
        personality=interview.personality.value,
        duration=interview.duration,
        instructions=interview.config.additional_instructions if interview.config else None,
        allow_dynamic_questions=interview.config.allow_dynamic_questions if interview.config else False
    )
    
    # Get current interview question (if any)
    main_questions = [q for q in interview.questions if q.parent_question_id is None]
    main_questions.sort(key=lambda x: x.order_index)
    
    current_interview_question = None
    session_state = ws_manager.session_states.get(str(session.id), {})
    current_question_index = session_state.get("current_question_index", 0)
    
    if current_question_index < len(main_questions):
        current_question = main_questions[current_question_index]
        
        # Get clarifying questions
        clarifying_questions = [
            q for q in interview.questions 
            if q.parent_question_id == current_question.id
        ]
        clarifying_questions.sort(key=lambda x: x.order_index)
        
        current_interview_question = InterviewQuestionContext(
            id=str(current_question.id),
            text=current_question.question_text,
            order_index=current_question.order_index,
            clarifying_instructions=None,  # TODO: add to InterviewQuestion model if needed
            clarifying_questions=[q.question_text for q in clarifying_questions] if clarifying_questions else None
        )
    
    # Build user response
    user_response = None
    if user_response_text:
        user_response = UserResponse(
            text=user_response_text,
            timestamp=datetime.now(timezone.utc)
        )
    
    # Calculate remaining time
    if session.started_at:
        elapsed = datetime.now(timezone.utc) - session.started_at
        remaining_seconds = max(0, interview.duration * 60 - elapsed.total_seconds())
        remaining_time = RemainingTime(
            minutes=int(remaining_seconds // 60),
            seconds=int(remaining_seconds % 60)
        )
    else:
        remaining_time = RemainingTime(
            minutes=interview.duration,
            seconds=0
        )
    
    # Build conversation history from transcript
    transcript_messages = session.transcript_messages if hasattr(session, 'transcript_messages') else []
    transcript_messages = sorted(transcript_messages, key=lambda x: x.order_index)
    
    conversation_history = [
        ConversationMessage(
            role=msg.role,
            message=msg.message_text,
            timestamp=msg.timestamp
        )
        for msg in transcript_messages
    ]
    
    # Get session history (question-answers)
    session_history_list = await get_session_question_answer_summaries(db, session.id)
    
    # Build question progress
    total_questions = len(main_questions)
    answered_questions = len([qa for qa in session_history_list if qa.question_type == "main"])
    
    question_progress = QuestionProgress(
        current_question_index=current_question_index,
        total_questions=total_questions,
        answered_questions=answered_questions
    )
    
    # Build context
    context = GPTContextRequest(
        interview=interview_context,
        current_interview_question=current_interview_question,
        user_response=user_response,
        remaining_time=remaining_time,
        conversation_history=conversation_history,
        question_progress=question_progress,
        session_history=session_history_list,
        allow_dynamic_questions=interview.config.allow_dynamic_questions if interview.config else False
    )
    
    return context

