"""WebSocket handler for live interview dialog"""
import json
import uuid
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.session import Session
from app.models.interview import Interview, InterviewStatus, TranscriptMessage
from app.services.openai_service import OpenAIService
from app.services.audio_service import AudioService
from app.core import openai_service


class InterviewWebSocketManager:
    """Manages WebSocket connections for interviews"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.interview_sessions: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, interview_id: str):
        """Accept WebSocket connection"""
        await websocket.accept()
        self.active_connections[interview_id] = websocket
        
        # Initialize interview session
        if interview_id not in self.interview_sessions:
            self.interview_sessions[interview_id] = {
                "transcript": [],
                "audio_chunks": [],
                "question_index": 0,
                "started": False,
            }
    
    def disconnect(self, interview_id: str):
        """Remove WebSocket connection"""
        if interview_id in self.active_connections:
            del self.active_connections[interview_id]
        if interview_id in self.interview_sessions:
            del self.interview_sessions[interview_id]
    
    async def send_message(self, interview_id: str, message: Dict[str, Any]):
        """Send message to client"""
        if interview_id in self.active_connections:
            try:
                await self.active_connections[interview_id].send_json(message)
            except Exception as e:
                print(f"Error sending message to {interview_id}: {e}")
                self.disconnect(interview_id)
    
    async def receive_message(self, interview_id: str) -> Dict[str, Any]:
        """Receive message from client"""
        if interview_id not in self.active_connections:
            raise ValueError("No active connection")
        
        data = await self.active_connections[interview_id].receive()
        
        if "text" in data:
            return json.loads(data["text"])
        elif "bytes" in data:
            return {"type": "audio", "data": data["bytes"]}
        else:
            return {}


# Global WebSocket manager instance
ws_manager = InterviewWebSocketManager()


async def handle_interview_websocket(
    websocket: WebSocket,
    session_id: str,
    candidate_name: Optional[str] = None,
    candidate_email: Optional[str] = None
):
    """
    WebSocket handler for interview
    
    Message types:
    - start: Start interview
    - audio: Audio chunk from user
    - text: Text message (fallback)
    - end: End interview
    """
    # Create database session
    async with AsyncSessionLocal() as db:
        try:
            session_uuid = uuid.UUID(session_id)
        except ValueError:
            await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA, reason="Invalid session ID")
            return
        
        # Get session
        result = await db.execute(
            select(Session)
            .options(
                selectinload(Session.questions),
                selectinload(Session.evaluation_criteria),
                selectinload(Session.config)
            )
            .where(Session.id == session_uuid)
        )
        session = result.scalar_one_or_none()
        
        if not session:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Session not found")
            return
        
        # Create or get interview
        interview = await _get_or_create_interview(
            db, session, candidate_name or "Гость", candidate_email
        )
        interview_id = str(interview.id)
        
        # Connect WebSocket
        await ws_manager.connect(websocket, interview_id)
        
        # Initialize audio service
        audio_service = AudioService()
        
        try:
            # Send welcome message
            await ws_manager.send_message(interview_id, {
                "type": "connected",
                "message": "Подключено к интервью",
                "interview_id": interview_id
            })
            
            # Main message loop
            while True:
                try:
                    # Receive message
                    data = await ws_manager.receive_message(interview_id)
                    
                    message_type = data.get("type", "unknown")
                    
                    if message_type == "start":
                        await _handle_start_interview(
                            interview_id, interview, session, db, audio_service
                        )
                    
                    elif message_type == "audio":
                        await _handle_audio_chunk(
                            interview_id, interview, session, data, db, audio_service
                        )
                    
                    elif message_type == "text":
                        await _handle_text_message(
                            interview_id, interview, session, data, db, audio_service
                        )
                    
                    elif message_type == "end":
                        await _handle_end_interview(
                            interview_id, interview, db
                        )
                        break
                    
                    else:
                        await ws_manager.send_message(interview_id, {
                            "type": "error",
                            "message": f"Unknown message type: {message_type}"
                        })
                        
                except WebSocketDisconnect:
                    break
                except Exception as e:
                    print(f"Error handling message: {e}")
                    await ws_manager.send_message(interview_id, {
                        "type": "error",
                        "message": str(e)
                    })
        
        except WebSocketDisconnect:
            pass
        finally:
            # Cleanup
            ws_manager.disconnect(interview_id)


async def _get_or_create_interview(
    db: AsyncSession,
    session: Session,
    candidate_name: str,
    candidate_email: Optional[str]
) -> Interview:
    """Get or create interview instance"""
    # Check if interview already exists (for reconnection)
    result = await db.execute(
        select(Interview)
        .where(
            Interview.session_id == session.id,
            Interview.candidate_name == candidate_name,
            Interview.status == InterviewStatus.IN_PROGRESS
        )
        .order_by(Interview.created_at.desc())
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        return existing
    
    # Create new interview
    new_interview = Interview(
        session_id=session.id,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        status=InterviewStatus.PENDING
    )
    
    db.add(new_interview)
    await db.commit()
    await db.refresh(new_interview)
    
    return new_interview


async def _handle_start_interview(
    interview_id: str,
    interview: Interview,
    session: Session,
    db: AsyncSession,
    audio_service: AudioService
):
    """Handle interview start"""
    # Update interview status
    interview.status = InterviewStatus.IN_PROGRESS
    interview.started_at = datetime.utcnow()
    await db.commit()
    
    # Get greeting from OpenAI
    session_params = _build_session_params(session)
    
    greeting = await openai_service.generate_chat_response(
        messages=[],
        system_prompt=openai_service._build_interview_system_prompt(session_params),
        temperature=0.7,
        max_tokens=200
    )
    
    # Generate audio for greeting
    audio_bytes = await openai_service.text_to_speech(
        text=greeting,
        language=session.language.value
    )
    
    # Save audio chunk
    audio_path = await audio_service.save_audio(
        interview_id=interview_id,
        audio_data=audio_bytes,
        filename=f"greeting_{datetime.utcnow().timestamp()}.mp3"
    )
    
    # Save transcript message
    ai_message = TranscriptMessage(
        interview_id=interview.id,
        role="ai",
        message_text=greeting,
        timestamp=datetime.utcnow(),
        audio_chunk_url=audio_path,
        order_index=0
    )
    db.add(ai_message)
    await db.commit()
    
    # Send greeting to client
    await ws_manager.send_message(interview_id, {
        "type": "message",
        "role": "ai",
        "message": greeting,
        "audio_url": audio_path,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Update session state
    ws_manager.interview_sessions[interview_id]["started"] = True


async def _handle_audio_chunk(
    interview_id: str,
    interview: Interview,
    session: Session,
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
        language=session.language.value,
        filename="user_audio.webm"
    )
    
    if not transcript_text:
        await ws_manager.send_message(interview_id, {
            "type": "error",
            "message": "Не удалось распознать речь. Попробуйте повторить."
        })
        return
    
    # Save user message
    session_state = ws_manager.interview_sessions[interview_id]
    order_index = len(session_state["transcript"])
    
    user_message = TranscriptMessage(
        interview_id=interview.id,
        role="user",
        message_text=transcript_text,
        timestamp=datetime.utcnow(),
        order_index=order_index
    )
    db.add(user_message)
    await db.commit()
    
    session_state["transcript"].append({
        "role": "user",
        "message": transcript_text,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Send confirmation to user
    await ws_manager.send_message(interview_id, {
        "type": "transcription",
        "message": transcript_text,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Generate AI response
    session_params = _build_session_params(session)
    conversation_history = [
        {"role": msg.get("role", "user"), "content": msg.get("message", "")}
        for msg in session_state["transcript"]
    ]
    
    ai_response_text = await openai_service.generate_interview_response(
        user_message=transcript_text,
        session_params=session_params,
        conversation_history=conversation_history
    )
    
    # Generate audio for response
    ai_audio_bytes = await openai_service.text_to_speech(
        text=ai_response_text,
        language=session.language.value
    )
    
    # Save audio
    ai_audio_path = await audio_service.save_audio(
        interview_id=interview_id,
        audio_data=ai_audio_bytes,
        filename=f"ai_response_{datetime.utcnow().timestamp()}.mp3"
    )
    
    # Save AI message
    order_index += 1
    ai_message = TranscriptMessage(
        interview_id=interview.id,
        role="ai",
        message_text=ai_response_text,
        timestamp=datetime.utcnow(),
        audio_chunk_url=ai_audio_path,
        order_index=order_index
    )
    db.add(ai_message)
    await db.commit()
    
    session_state["transcript"].append({
        "role": "ai",
        "message": ai_response_text,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Send AI response to client
    await ws_manager.send_message(interview_id, {
        "type": "message",
        "role": "ai",
        "message": ai_response_text,
        "audio_url": ai_audio_path,
        "timestamp": datetime.utcnow().isoformat()
    })


async def _handle_text_message(
    interview_id: str,
    interview: Interview,
    session: Session,
    data: Dict[str, Any],
    db: AsyncSession,
    audio_service: AudioService
):
    """Handle text message (fallback)"""
    text = data.get("text", "")
    if not text:
        return
    
    # Save user message
    session_state = ws_manager.interview_sessions[interview_id]
    order_index = len(session_state["transcript"])
    
    user_message = TranscriptMessage(
        interview_id=interview.id,
        role="user",
        message_text=text,
        timestamp=datetime.utcnow(),
        order_index=order_index
    )
    db.add(user_message)
    await db.commit()
    
    session_state["transcript"].append({
        "role": "user",
        "message": text,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Send confirmation
    await ws_manager.send_message(interview_id, {
        "type": "transcription",
        "message": text,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Generate AI response
    session_params = _build_session_params(session)
    conversation_history = [
        {"role": msg.get("role", "user"), "content": msg.get("message", "")}
        for msg in session_state["transcript"]
    ]
    
    ai_response_text = await openai_service.generate_interview_response(
        user_message=text,
        session_params=session_params,
        conversation_history=conversation_history
    )
    
    # Generate audio for response
    ai_audio_bytes = await openai_service.text_to_speech(
        text=ai_response_text,
        language=session.language.value
    )
    
    # Save audio
    ai_audio_path = await audio_service.save_audio(
        interview_id=interview_id,
        audio_data=ai_audio_bytes,
        filename=f"ai_response_{datetime.utcnow().timestamp()}.mp3"
    )
    
    # Save AI message
    order_index += 1
    ai_message = TranscriptMessage(
        interview_id=interview.id,
        role="ai",
        message_text=ai_response_text,
        timestamp=datetime.utcnow(),
        audio_chunk_url=ai_audio_path,
        order_index=order_index
    )
    db.add(ai_message)
    await db.commit()
    
    session_state["transcript"].append({
        "role": "ai",
        "message": ai_response_text,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Send AI response to client
    await ws_manager.send_message(interview_id, {
        "type": "message",
        "role": "ai",
        "message": ai_response_text,
        "audio_url": ai_audio_path,
        "timestamp": datetime.utcnow().isoformat()
    })


async def _handle_end_interview(
    interview_id: str,
    interview: Interview,
    db: AsyncSession
):
    """Handle interview end"""
    interview.status = InterviewStatus.COMPLETED
    interview.completed_at = datetime.utcnow()
    await db.commit()
    
    await ws_manager.send_message(interview_id, {
        "type": "ended",
        "message": "Интервью завершено",
        "timestamp": datetime.utcnow().isoformat()
    })


def _build_session_params(session: Session) -> Dict[str, Any]:
    """Build session params dict from Session model"""
    questions = [q.question_text for q in sorted(session.questions, key=lambda x: x.order_index)] if session.questions else []
    criteria = [c.criterion_name for c in sorted(session.evaluation_criteria, key=lambda x: x.order_index)] if session.evaluation_criteria else []
    
    config = session.config
    customer_sim = None
    if config and config.customer_simulation:
        cs = config.customer_simulation
        customer_sim = {
            "enabled": cs.get("enabled", False),
            "scenario": cs.get("scenario"),
            "role": cs.get("role")
        }
    
    return {
        "position": session.position,
        "company": session.company,
        "interview_type": session.interview_type.value if session.interview_type else "screening",
        "personality": session.personality.value,
        "language": session.language.value,
        "questions": questions,
        "evaluation_criteria": criteria,
        "customer_simulation": customer_sim,
        "difficulty": session.difficulty.value,
        "duration": session.duration,
    }

