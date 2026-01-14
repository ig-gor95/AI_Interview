"""Interview models - Active interviews with candidates"""
from sqlalchemy import Column, String, Integer, Enum, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base


class InterviewStatus(str, enum.Enum):
    """Interview status enum"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Interview(Base):
    """Interview model - Active interview with candidate"""
    __tablename__ = "interviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)  # может быть гость
    candidate_name = Column(String(255), nullable=False)  # имя кандидата (если не зарегистрирован)
    candidate_email = Column(String(255), nullable=True)  # email кандидата
    status = Column(Enum(InterviewStatus), nullable=False, default=InterviewStatus.PENDING, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    audio_file_path = Column(String(1000), nullable=True)  # путь к аудио записи
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="interviews")
    candidate = relationship("User", foreign_keys=[candidate_id])
    transcript_messages = relationship("TranscriptMessage", back_populates="interview", cascade="all, delete-orphan", order_by="TranscriptMessage.order_index")
    evaluation = relationship("Evaluation", back_populates="interview", uselist=False, cascade="all, delete-orphan")
    candidate_status = relationship("CandidateStatus", back_populates="interview", uselist=False, cascade="all, delete-orphan")
    simulation_scenario = relationship("SimulationScenario", back_populates="interview", uselist=False, cascade="all, delete-orphan")
    question_answers = relationship("QuestionAnswer", back_populates="interview", cascade="all, delete-orphan", order_by="QuestionAnswer.order_index")
    
    def __repr__(self):
        return f"<Interview(id={self.id}, session_id={self.session_id}, status={self.status})>"


class TranscriptMessage(Base):
    """Transcript messages - Dialog messages"""
    __tablename__ = "transcript_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, index=True)
    role = Column(String(10), nullable=False)  # 'ai' or 'user'
    message_text = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    audio_chunk_url = Column(String(1000), nullable=True)  # URL аудио chunk'а (для AI сообщений)
    order_index = Column(Integer, nullable=False, default=0)  # порядок в диалоге
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="transcript_messages")
    
    def __repr__(self):
        return f"<TranscriptMessage(id={self.id}, role={self.role}, order={self.order_index})>"


class QuestionAnswer(Base):
    """Question-answer pairs from interview"""
    __tablename__ = "question_answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)  # вопрос из session_questions
    answer_text = Column(Text, nullable=False)  # ответ кандидата
    analysis_note = Column(Text, nullable=True)  # анализ ответа AI
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="question_answers")
    
    def __repr__(self):
        return f"<QuestionAnswer(id={self.id}, interview_id={self.interview_id}, order={self.order_index})>"

