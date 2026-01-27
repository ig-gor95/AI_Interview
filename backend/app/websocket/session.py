"""WebSocket handler for live interview session dialog"""
import json
import uuid
import base64
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from fastapi import WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.session import Session, SessionStatus, SessionTranscript, SessionQuestionAnswer
from app.models.interview import Interview, InterviewQuestion
from app.models.simulation import SimulationScenario, SimulationDialog
from app.services.openai_service import AIService
from app.services.audio_service import AudioService
from app.core import tts_service
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
        if session_id not in self.active_connections:
            print(f"[WebSocket] Warning: No active connection for session {session_id}")
            print(f"[WebSocket] Active connections: {list(self.active_connections.keys())}")
            return
        
        # Check if connection is still open
        websocket = self.active_connections[session_id]
        if websocket.client_state.name not in ["CONNECTED"]:
            print(f"[WebSocket] Warning: Connection for session {session_id} is not in CONNECTED state: {websocket.client_state.name}")
            # Remove stale connection
            self.disconnect(session_id)
            return
        
        try:
            print(f"[WebSocket] Sending message to session {session_id}: type={message.get('type')}, role={message.get('role')}")
            await websocket.send_json(message)
            print(f"[WebSocket] Message sent successfully to session {session_id}")
        except Exception as e:
            print(f"[WebSocket] Error sending message to {session_id}: {e}")
            import traceback
            traceback.print_exc()
            # Only disconnect if it's a connection error, not a send error
            # This prevents closing connection on transient errors
            if "closed" in str(e).lower() or "disconnect" in str(e).lower():
                print(f"[WebSocket] Connection appears closed, disconnecting session {session_id}")
                self.disconnect(session_id)
    
    async def receive_message(self, session_id: str) -> Dict[str, Any]:
        """Receive message from client"""
        if session_id not in self.active_connections:
            raise ValueError("No active connection")

        print(f"[WebSocket] receive_message called for session {session_id}")
        data = await self.active_connections[session_id].receive()
        print(f"[WebSocket] Raw received data type: {type(data)}, keys: {list(data.keys()) if isinstance(data, dict) else 'not dict'}")

        if "text" in data:
            text_data = data["text"]
            print(f"[WebSocket] Received text message, length: {len(text_data)}, first 200 chars: {text_data[:200]}...")
            try:
                parsed = json.loads(text_data)
                print(f"[WebSocket] JSON parsed successfully, type: {parsed.get('type')}, keys: {list(parsed.keys())}")
                return parsed
            except json.JSONDecodeError as e:
                print(f"[WebSocket] ERROR: Failed to parse JSON: {e}")
                print(f"[WebSocket] Raw text: {text_data}")
                return {"type": "unknown", "raw_text": text_data}
        elif "bytes" in data:
            bytes_data = data["bytes"]
            print(f"[WebSocket] Received binary message, size: {len(bytes_data)} bytes")
            return {"type": "audio", "data": bytes_data}
        else:
            print(f"[WebSocket] Received unknown message format, keys: {list(data.keys())}")
            for key, value in data.items():
                if key != "text" and key != "bytes":  # Don't log large data
                    print(f"[WebSocket]   {key}: {type(value)} - {str(value)[:100]}...")
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
        
        # Проверяем, является ли это восстановлением сессии
        # Сессия считается восстановленной, если она уже начата (IN_PROGRESS)
        is_resume = session.status == SessionStatus.IN_PROGRESS
        
        try:
            if is_resume:
                # Восстановление сессии - загружаем историю (если есть)
                transcript_messages = sorted(session.transcript_messages, key=lambda x: x.order_index) if session.transcript_messages else []
                question_answers = sorted(session.question_answers, key=lambda x: x.order_index) if session.question_answers else []
                
                # Определяем следующий вопрос из шаблона
                main_questions = [q for q in interview.questions if q.parent_question_id is None]
                main_questions.sort(key=lambda x: x.order_index)
                
                # Находим количество заданных основных вопросов
                answered_main_count = len([qa for qa in question_answers if qa.question_type == "main"])
                next_question_index = answered_main_count
                
                # Инициализируем session_state с историей
                session_state = ws_manager.session_states[session_id]
                session_state["transcript"] = [
                    {
                        "role": msg.role,
                        "message": msg.message_text,
                        "timestamp": msg.timestamp.isoformat()
                    }
                    for msg in transcript_messages
                ]
                session_state["current_question_index"] = next_question_index
                session_state["started"] = True
                
                # Определяем, ожидаем ли мы ответа о готовности
                # Если последнее сообщение от AI и это приветствие - ждем готовности
                if transcript_messages and transcript_messages[-1].role == "ai":
                    last_ai_msg = transcript_messages[-1].message_text.lower()
                    if "готов" in last_ai_msg or "ready" in last_ai_msg:
                        session_state["waiting_for_readiness"] = True
                    else:
                        session_state["waiting_for_readiness"] = False
                else:
                    # Если транскрипт пустой, сессия только началась - ждем готовности
                    session_state["waiting_for_readiness"] = True
                
                # Отправляем историю клиенту (может быть пустой, если сессия только началась)
                await ws_manager.send_message(session_id, {
                    "type": "resume",
                    "message": "Сессия восстановлена",
                    "session_id": session_id,
                    "transcript": [
                        {
                            "role": msg.role,
                            "message": msg.message_text,
                            "timestamp": msg.timestamp.isoformat(),
                            "audioUrl": msg.audio_chunk_url
                        }
                        for msg in transcript_messages
                    ],
                    "nextQuestionIndex": next_question_index
                })
                
                # Если транскрипт пустой, значит приветствие еще не было отправлено
                # Автоматически отправляем приветствие
                if not transcript_messages:
                    print(f"[handle_session_websocket] Empty transcript, calling _handle_start_session for session {session_id}")
                    try:
                        await _handle_start_session(
                            session_id, session, interview, db, audio_service
                        )
                        print(f"[handle_session_websocket] _handle_start_session completed for session {session_id}, entering main message loop")
                    except Exception as e:
                        print(f"[handle_session_websocket] ERROR in _handle_start_session: {e}")
                        import traceback
                        traceback.print_exc()
                        # Try to send error to client, but don't fail if connection is closed
                        try:
                            # Check if connection still exists before sending
                            if session_id in ws_manager.active_connections:
                                await ws_manager.send_message(session_id, {
                                    "type": "error",
                                    "message": f"Ошибка при генерации приветствия: {str(e)}"
                                })
                            else:
                                print(f"[handle_session_websocket] Connection already closed, skipping error message")
                        except Exception as send_error:
                            print(f"[handle_session_websocket] Failed to send error message (connection may be closed): {send_error}")
                        # Continue to main loop even if greeting failed
                        print(f"[handle_session_websocket] Continuing to main message loop despite error")
                else:
                    print(f"[handle_session_websocket] Transcript has {len(transcript_messages)} messages, not calling _handle_start_session, entering main message loop")
            else:
                # Новая сессия
                try:
                    # Send welcome message
                    await ws_manager.send_message(session_id, {
                        "type": "connected",
                        "message": "Подключено к интервью",
                        "session_id": session_id
                    })
                except Exception as e:
                    print(f"Error sending welcome message: {e}")
            
            # Main message loop
            print(f"[handle_session_websocket] Entering main message loop for session {session_id}")
            while True:
                try:
                    # Check websocket connection state
                    if session_id in ws_manager.active_connections:
                        ws = ws_manager.active_connections[session_id]
                        print(f"[handle_session_websocket] WebSocket state: {ws.client_state.name}, loop iteration starting")
                    else:
                        print(f"[handle_session_websocket] ERROR: No active connection for session {session_id} in main loop")
                        break

                    # Receive message
                    print(f"[handle_session_websocket] Waiting for message from client...")
                    data = await ws_manager.receive_message(session_id)
                    print(f"[handle_session_websocket] Message received, type: {data.get('type')}, full data keys: {list(data.keys()) if isinstance(data, dict) else 'not dict'}")

                    message_type = data.get("type", "unknown")
                    
                    if message_type == "start":
                        print(f"[handle_session_websocket] Handling 'start' message")
                        await _handle_start_session(
                            session_id, session, interview, db, audio_service
                        )
                        print(f"[handle_session_websocket] 'start' message handled, continuing to wait for next message")
                    
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
                    print(f"[handle_session_websocket] WebSocket disconnected for session {session_id}")
                    break
                except Exception as e:
                    print(f"[handle_session_websocket] ERROR handling message: {e}")
                    import traceback
                    traceback.print_exc()
                    # Try to send error message, but check connection first
                    try:
                        # Only send if connection is still active
                        if session_id in ws_manager.active_connections:
                            await ws_manager.send_message(session_id, {
                                "type": "error",
                                "message": str(e)
                            })
                        else:
                            print(f"[handle_session_websocket] Connection closed, cannot send error message")
                            break  # Connection is broken, exit loop
                    except Exception as send_error:
                        print(f"[handle_session_websocket] ERROR sending error message (connection may be closed): {send_error}")
                        # Check if it's a connection error
                        if "closed" in str(send_error).lower() or session_id not in ws_manager.active_connections:
                            break  # Connection is broken, exit loop
        
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
    try:
        print(f"[_handle_start_session] Starting session {session_id}")
        
        # Update session status
        if session.status == SessionStatus.PENDING:
            session.status = SessionStatus.IN_PROGRESS
            session.started_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(session)
        
        # Получение приветствия от AI (DeepSeek) по структурированному контексту
        print(f"[_handle_start_session] Building GPT context...")
        context = await _build_gpt_context(session, interview, db)
        print(f"[_handle_start_session] GPT context built")
        
        # Generate greeting question
        print(f"[_handle_start_session] Generating greeting from AI (DeepSeek)...")
        try:
            greeting_response = await openai_service.generate_session_question_structured(context)
            greeting_text = greeting_response.question.text
            print(f"[_handle_start_session] Greeting generated: {greeting_text[:100]}...")
        except Exception as gpt_error:
            # Handle timeout or other GPT errors gracefully
            error_msg = str(gpt_error)
            print(f"[_handle_start_session] ERROR generating greeting: {error_msg}")
            
            # Check if it's a timeout error
            if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                # Use fallback greeting if timeout
                print(f"[_handle_start_session] Using fallback greeting due to timeout")
                greeting_text = f"Здравствуйте! Я провожу скрининг-собеседование в компанию {interview.company_name or 'нашу компанию'} на позицию {interview.position or 'вакансию'}. Готовы ли вы начать?"
            else:
                # For other errors, use a simple fallback
                print(f"[_handle_start_session] Using fallback greeting due to error")
                greeting_text = "Здравствуйте! Я провожу скрининг-собеседование. Готовы ли вы начать?"
            
            # Create a minimal response structure
            from app.schemas.session import QuestionResponse, GPTResponse, QuestionMetadata
            greeting_response = GPTResponse(
                question=QuestionResponse(
                    text=greeting_text,
                    type="main",
                    is_clarifying=False,
                    is_dynamic=False,
                    parent_session_question_answer_id=None
                ),
                metadata=QuestionMetadata(
                    needsClarification=False,
                    answerQuality="complete",
                    shouldMoveNext=False,
                    estimatedTimeRemaining=None
                )
            )
            print(f"[_handle_start_session] Created fallback GPTResponse with metadata: {greeting_response.metadata}")
        
        # Update session state FIRST (before audio generation)
        session_state = ws_manager.session_states[session_id]
        session_state["started"] = True
        session_state["waiting_for_readiness"] = True  # Флаг ожидания подтверждения готовности
        session_state["transcript"].append({
            "role": "ai",
            "message": greeting_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        # Generate audio for greeting synchronously (before sending message)
        greeting_audio_url = None
        if tts_service is not None:
            try:
                print(f"[_handle_start_session] Generating greeting audio using {type(tts_service).__name__}...")
                greeting_audio_bytes = await tts_service.text_to_speech(
                    text=greeting_text,
                    language_code=interview.language.value
                )
                print(f"[_handle_start_session] Greeting audio generated, size: {len(greeting_audio_bytes)} bytes")

                # Save greeting audio
                greeting_audio_path = await audio_service.save_audio(
                    interview_id=session_id,
                    audio_data=greeting_audio_bytes,
                    filename=f"greeting_{datetime.now(timezone.utc).timestamp()}.mp3"
                )

                # Convert local path to HTTP URL
                from pathlib import Path
                audio_path_obj = Path(greeting_audio_path)
                filename = audio_path_obj.name
                greeting_audio_url = f"/api/results/audio/{session_id}/{filename}"

                print(f"[_handle_start_session] Greeting audio saved: {greeting_audio_path}, URL: {greeting_audio_url}")

            except Exception as audio_error:
                print(f"[_handle_start_session] ERROR generating greeting audio: {audio_error}")
                import traceback
                traceback.print_exc()
        else:
            print(f"[_handle_start_session] TTS disabled, skipping audio generation")

        # Send greeting to client (with audio if available)
        message = {
            "type": "message",
            "role": "ai",
            "message": greeting_text,
            "audio_url": greeting_audio_url,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": greeting_response.metadata.dict() if greeting_response.metadata else None
        }
        print(f"[_handle_start_session] Sending message to client with audio_url: {message.get('audio_url')}")
        await ws_manager.send_message(session_id, message)
        print(f"[_handle_start_session] Message sent successfully")

        # Check websocket state after sending greeting
        if session_id in ws_manager.active_connections:
            ws = ws_manager.active_connections[session_id]
            print(f"[_handle_start_session] WebSocket state after greeting: {ws.client_state.name}")
        else:
            print(f"[_handle_start_session] WARNING: WebSocket connection lost after sending greeting!")

        # Save transcript with audio URL (if available)
        ai_message = SessionTranscript(
            session_id=session.id,
            role="ai",
            message_text=greeting_text,
            timestamp=datetime.now(timezone.utc),
            audio_chunk_url=greeting_audio_url,
            order_index=0
        )
        db.add(ai_message)
        await db.commit()
        print(f"[_handle_start_session] Transcript saved with audio URL: {greeting_audio_url}")
        
    except Exception as e:
        print(f"[_handle_start_session] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Send error message to client
        try:
            await ws_manager.send_message(session_id, {
                "type": "error",
                "message": f"Ошибка при генерации приветствия: {str(e)}"
            })
        except:
            pass
        raise


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
    
    # Проверка на истечение времени
    time_expired = session_state.get("time_expired", False)
    
    # Проверяем, истекло ли время
    if session.started_at and interview.duration:
        elapsed = datetime.now(timezone.utc) - session.started_at
        elapsed_minutes = elapsed.total_seconds() / 60
        if elapsed_minutes >= interview.duration and not time_expired:
            # Время истекло - устанавливаем флаг и отправляем сообщение
            session_state["time_expired"] = True
            time_expired = True
            
            # Отправляем сообщение о завершении времени
            await ws_manager.send_message(session_id, {
                "type": "time_expired",
                "message": "Время интервью истекло. Интервью завершено. Если у вас есть дополнительный вопрос или дополнение, вы можете его озвучить - эта информация будет добавлена к результатам.",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    
    if time_expired:
        # Если время истекло, сохраняем дополнительное сообщение (если это не первое сообщение после истечения)
        if session_state.get("additional_message_sent", False):
            # Уже отправили дополнительное сообщение - завершаем сессию
            await _handle_end_session(session_id, session, db)
            return
        else:
            # Первое дополнительное сообщение после истечения времени
            session_state["additional_message_sent"] = True
            
            result = await db.execute(
                select(SessionTranscript)
                .where(SessionTranscript.session_id == session.id)
                .order_by(SessionTranscript.order_index.desc())
                .limit(1)
            )
            last_transcript = result.scalar_one_or_none()
            next_order_index = (last_transcript.order_index + 1) if last_transcript else 0
            
            # Сохраняем дополнительное сообщение
            user_message = SessionTranscript(
                session_id=session.id,
                role="user",
                message_text=user_text,
                timestamp=datetime.now(timezone.utc),
                order_index=next_order_index
            )
            db.add(user_message)
            await db.commit()
            
            # После сохранения дополнительного сообщения завершаем сессию
            await _handle_end_session(session_id, session, db)
            return
    
    # Проверка ожидания подтверждения готовности
    waiting_for_readiness = session_state.get("waiting_for_readiness", False)
    if waiting_for_readiness:
        # Анализируем ответ о готовности (простая проверка ключевых слов)
        user_text_lower = user_text.lower()
        ready_keywords = ["да", "готов", "готовы", "конечно", "начинаем", "можно", "давай", "начнем"]
        not_ready_keywords = ["нет", "не готов", "не готовы", "подожди", "подождите", "минуту", "секунду"]
        
        is_ready = any(keyword in user_text_lower for keyword in ready_keywords)
        is_not_ready = any(keyword in user_text_lower for keyword in not_ready_keywords)
        
        if is_ready and not is_not_ready:
            # Пользователь готов - сбрасываем флаг и продолжаем с первым вопросом
            session_state["waiting_for_readiness"] = False
            session_state["current_question_index"] = 0
        elif is_not_ready:
            # Пользователь не готов - GPT должен попросить подать сигнал
            # Продолжаем с флагом waiting_for_readiness = True
            pass
        # Если ответ неясный, GPT сам решит что делать
    
    # Get current order index
    result = await db.execute(
        select(SessionTranscript)
        .where(SessionTranscript.session_id == session.id)
        .order_by(SessionTranscript.order_index.desc())
        .limit(1)
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
    
    # Если симуляция активна, сохраняем ответ пользователя в SimulationDialog
    if session_state.get("simulation_active", False):
        result = await db.execute(
            select(SimulationScenario)
            .where(SimulationScenario.session_id == session.id)
        )
        scenario = result.scalar_one_or_none()

        if scenario:
            # Получаем последний order_index для диалога
            result = await db.execute(
                select(SimulationDialog)
                .where(SimulationDialog.scenario_id == scenario.id)
                .order_by(SimulationDialog.order_index.desc())
                .limit(1)
            )
            last_dialog = result.scalar_one_or_none()
            dialog_order = (last_dialog.order_index + 1) if last_dialog else 0
            
            # Сохраняем ответ пользователя в диалог симуляции
            user_simulation_dialog = SimulationDialog(
                scenario_id=scenario.id,
                role="user",
                message_text=user_text,
                tone=None,
                order_index=dialog_order
            )
            db.add(user_simulation_dialog)
    
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
        .limit(1)
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
        .limit(1)
    )
    last_ai_message = result.scalar_one_or_none()
    last_question_text = last_ai_message.message_text if last_ai_message else "Приветствие"
    
    # Симуляция считается завершённой, если в диалоге уже есть хотя бы 1 реплика AI и 1 реплика user
    simulation_done = False
    if session_state.get("simulation_active", False):
        result = await db.execute(
            select(SimulationScenario).where(SimulationScenario.session_id == session.id)
        )
        scenario = result.scalar_one_or_none()
        if scenario:
            result = await db.execute(
                select(SimulationDialog.role, func.count(SimulationDialog.id).label("cnt"))
                .where(SimulationDialog.scenario_id == scenario.id)
                .group_by(SimulationDialog.role)
            )
            counts = {row[0]: row[1] for row in result.fetchall()}
            simulation_done = counts.get("ai", 0) >= 1 and counts.get("user", 0) >= 1
            if simulation_done:
                print(f"[_process_user_response] simulation_done=True (ai={counts.get('ai',0)}, user={counts.get('user',0)})")
    
    # Проверяем, есть ли ожидающий вопрос из шаблона после динамического вопроса
    pending_template_question = session_state.get("pending_template_question")
    if pending_template_question:
        # Пользователь ответил на динамический вопрос, теперь задаем вопрос из шаблона
        session_state.pop("pending_template_question", None)
        # Используем сохраненный вопрос из шаблона
        context = await _build_gpt_context(session, interview, db, user_response_text=user_text, simulation_done=simulation_done)
        # Принудительно устанавливаем текущий вопрос из шаблона
        context.current_interview_question = pending_template_question
        # Обновляем индекс вопроса
        session_state["current_question_index"] = pending_template_question.order_index
    else:
        # Обычная обработка - сохраняем question-answer если это не ответ о готовности
        if not waiting_for_readiness or session_state.get("waiting_for_readiness") == False:
            qa = await save_session_question_answer(
                db=db,
                session_id=session.id,
                question_text=last_question_text,
                answer_text=user_text,
                question_type=question_type,
                parent_session_qa_id=parent_qa_id
            )
            session_state["last_question_qa_id"] = qa.id
        
        # Build GPT context with user response
        context = await _build_gpt_context(session, interview, db, user_response_text=user_text, simulation_done=simulation_done)
    
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
    
    # Проверяем, активирована ли симуляция (customer_simulation)
    # Симуляция активируется, если все вопросы заданы или осталось мало времени
    # и GPT начинает играть роль клиента
    simulation_active = False
    if interview.config and interview.config.customer_simulation:
        cs_data = interview.config.customer_simulation
        if isinstance(cs_data, dict) and cs_data.get("enabled"):
            # Проверяем условия для активации симуляции
            all_questions_asked = context.question_progress.current_question_index >= context.question_progress.total_questions
            time_low = context.remaining_time.minutes < 5
            
            # Проверяем, не создан ли уже SimulationScenario
            result = await db.execute(
                select(SimulationScenario)
                .where(SimulationScenario.session_id == session.id)
            )
            existing_scenario = result.scalar_one_or_none()
            
            # Если симуляция должна быть активирована и еще не создана
            if (all_questions_asked or time_low) and not existing_scenario:
                # Создаем SimulationScenario для сессии
                simulation_scenario = SimulationScenario(
                    session_id=session.id,
                    interview_id=None,  # Для сессии не нужен interview_id
                    scenario_type="customer_simulation",
                    scenario_description=cs_data.get("scenario", ""),
                    client_role=cs_data.get("role", ""),
                    client_behavior=None
                )
                db.add(simulation_scenario)
                await db.commit()
                await db.refresh(simulation_scenario)
                simulation_active = True
                session_state["simulation_active"] = True
            elif existing_scenario:
                simulation_active = True
                session_state["simulation_active"] = True
    
    # Обработка динамических вопросов: если is_dynamic=true, запоминаем что нужно задать вопрос из шаблона после ответа
    if gpt_response.question.is_dynamic and context.current_interview_question:
        # Сохраняем текущий вопрос из шаблона, чтобы задать его после ответа на динамический
        session_state["pending_template_question"] = context.current_interview_question
        # НЕ увеличиваем current_question_index, так как вопрос из шаблона еще не задан
    elif next_question_type == "main" and not gpt_response.question.is_dynamic:
        # Если задан основной вопрос из шаблона, увеличиваем индекс
        session_state["current_question_index"] = session_state.get("current_question_index", 0) + 1
    
    # Если симуляция активна, сохраняем диалог в SimulationDialog
    if simulation_active:
        result = await db.execute(
            select(SimulationScenario)
            .where(SimulationScenario.session_id == session.id)
        )
        scenario = result.scalar_one_or_none()
        
        if scenario:
            # Получаем последний order_index для диалога
            result = await db.execute(
                select(SimulationDialog)
                .where(SimulationDialog.scenario_id == scenario.id)
                .order_by(SimulationDialog.order_index.desc())
                .limit(1)
            )
            last_dialog = result.scalar_one_or_none()
            dialog_order = (last_dialog.order_index + 1) if last_dialog else 0

            # Сохраняем сообщение AI в диалог симуляции
            simulation_dialog = SimulationDialog(
                scenario_id=scenario.id,
                role="ai",
                message_text=next_question_text,
                tone=None,  # Можно определить по контексту
                order_index=dialog_order
            )
            db.add(simulation_dialog)
            await db.commit()
    
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
    ai_audio_url = None
    if tts_service is not None:
        try:
            ai_audio_bytes = await tts_service.text_to_speech(
                text=next_question_text,
                language_code=interview.language.value
            )

            # Save audio
            ai_audio_path = await audio_service.save_audio(
                interview_id=session_id,
                audio_data=ai_audio_bytes,
                filename=f"ai_response_{datetime.now(timezone.utc).timestamp()}.mp3"
            )

            # Convert local path to HTTP URL
            from pathlib import Path
            audio_path_obj = Path(ai_audio_path)
            filename = audio_path_obj.name
            ai_audio_url = f"/api/results/audio/{session_id}/{filename}"
            print(f"[_process_user_response] AI audio generated and saved: {ai_audio_url}")
        except Exception as audio_error:
            print(f"[_process_user_response] ERROR generating AI audio: {audio_error}")
            ai_audio_url = None
    else:
        print(f"[_process_user_response] TTS disabled, skipping AI audio generation")
    
    # Save AI message in transcript
    next_order_index += 1
    ai_message = SessionTranscript(
        session_id=session.id,
        role="ai",
        message_text=next_question_text,
        timestamp=datetime.now(timezone.utc),
        audio_chunk_url=ai_audio_url,
        order_index=next_order_index
    )
    db.add(ai_message)
    await db.commit()
    
    session_state["transcript"].append({
        "role": "ai",
        "message": next_question_text,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Update session state (только если qa был создан)
    if not waiting_for_readiness or session_state.get("waiting_for_readiness") == False:
        if 'qa' in locals() and qa:
            session_state["last_question_qa_id"] = qa.id
    
    # Send AI response to client
    await ws_manager.send_message(session_id, {
        "type": "message",
        "role": "ai",
        "message": next_question_text,
        "audio_url": ai_audio_url,
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

    # Trigger audio merging for completed interview
    try:
        from app.services.audio_merge_service import audio_merge_service
        merged_audio_path = await audio_merge_service.merge_interview_audio(session_id)
        if merged_audio_path:
            print(f"[SessionEnd] Audio merged successfully: {merged_audio_path}")
        else:
            print(f"[SessionEnd] No audio chunks found to merge for session {session_id}")
    except Exception as e:
        print(f"[SessionEnd] Error merging audio for session {session_id}: {e}")
        # Don't fail the session end due to audio merge errors

    await ws_manager.send_message(session_id, {
        "type": "ended",
        "message": "Интервью завершено",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


async def _build_gpt_context(
    session: Session,
    interview: Interview,
    db: AsyncSession,
    user_response_text: Optional[str] = None,
    simulation_done: bool = False
) -> GPTContextRequest:
    """Build GPT context request from session and interview"""
    
    # Build interview context
    customer_simulation = None
    if interview.config and interview.config.customer_simulation:
        cs_data = interview.config.customer_simulation
        if isinstance(cs_data, dict) and cs_data.get("enabled"):
            from app.schemas.session import CustomerSimulation
            customer_simulation = CustomerSimulation(
                enabled=True,
                role=cs_data.get("role"),
                scenario=cs_data.get("scenario")
            )
    
    interview_context = InterviewContext(
        id=str(interview.id),
        topic=interview.title,
        position=interview.position or "",
        company=interview.company,
        language=interview.language.value,
        personality=interview.personality.value,
        duration=interview.duration,
        instructions=interview.config.additional_instructions if interview.config else None,
        allow_dynamic_questions=interview.config.allow_dynamic_questions if interview.config else False,
        customer_simulation=customer_simulation
    )
    
    # Get current interview question (if any)
    main_questions = [q for q in interview.questions if q.parent_question_id is None]
    main_questions.sort(key=lambda x: x.order_index)
    
    current_interview_question = None
    session_state = ws_manager.session_states.get(str(session.id), {})
    
    # Определяем следующий вопрос из шаблона
    # При восстановлении сессии определяем на основе уже заданных вопросов
    current_question_index = session_state.get("current_question_index", 0)
    
    # Если current_question_index не установлен или равен 0, но есть история, определяем его на основе истории
    if current_question_index == 0 and len(session.transcript_messages) > 1:  # > 1 потому что есть приветствие
        # Получаем все заданные вопросы из истории
        session_history_list = await get_session_question_answer_summaries(db, session.id)
        answered_main_questions = [qa for qa in session_history_list if qa.question_type == "main"]
        
        if answered_main_questions:
            # Находим количество заданных основных вопросов
            # Следующий вопрос = количество заданных
            current_question_index = len(answered_main_questions)
            session_state["current_question_index"] = current_question_index
    
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
        allow_dynamic_questions=interview.config.allow_dynamic_questions if interview.config else False,
        simulation_done=simulation_done
    )
    
    return context

