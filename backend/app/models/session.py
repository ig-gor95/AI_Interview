"""Session models - Concrete interview sessions with candidates"""
from sqlalchemy import Column, String, Integer, Enum, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base


class SessionStatus(str, enum.Enum):
    """Session status enum"""
    PENDING = "pending"  # создана, но не начата
    IN_PROGRESS = "in_progress"  # идет интервью
    COMPLETED = "completed"  # завершена
    ABANDONED = "abandoned"  # прервана


class Session(Base):
    """Session model - Concrete interview session with candidate"""
    __tablename__ = "sessions"  # будет переименовано из interviews через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, index=True)  # ссылка на шаблон
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)  # может быть гость
    candidate_name = Column(String(255), nullable=False)  # имя кандидата
    candidate_email = Column(String(255), nullable=True)  # email кандидата
    candidate_surname = Column(String(255), nullable=True)  # фамилия кандидата
    status = Column(Enum(SessionStatus), nullable=False, default=SessionStatus.PENDING, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    audio_file_path = Column(String(1000), nullable=True)  # путь к аудио записи
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="sessions")
    candidate = relationship("User", foreign_keys=[candidate_id])
    question_answers = relationship("SessionQuestionAnswer", back_populates="session", cascade="all, delete-orphan", order_by="SessionQuestionAnswer.order_index")
    transcript_messages = relationship("SessionTranscript", back_populates="session", cascade="all, delete-orphan", order_by="SessionTranscript.order_index")
    evaluation = relationship("SessionEvaluation", back_populates="session", uselist=False, cascade="all, delete-orphan")
    candidate_status = relationship("CandidateStatus", back_populates="session", uselist=False, cascade="all, delete-orphan")
    simulation_scenario = relationship("SimulationScenario", back_populates="session", uselist=False, cascade="all, delete-orphan")
    link = relationship("InterviewLink", back_populates="session", uselist=False)
    
    def __repr__(self):
        return f"<Session(id={self.id}, interview_id={self.interview_id}, status={self.status})>"


class SessionQuestionAnswer(Base):
    """Session Question-Answer - Actual questions asked by GPT and candidate answers"""
    __tablename__ = "session_question_answers"  # будет переименовано из question_answers через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    
    # Структура вложенности
    parent_session_qa_id = Column(UUID(as_uuid=True), ForeignKey("session_question_answers.id"), nullable=True, index=True)
        # указывает на родительский SessionQuestionAnswer
    
    # Фактические данные сессии
    question_text = Column(Text, nullable=False)  # фактический вопрос, заданный GPT
    answer_text = Column(Text, nullable=False)  # ответ кандидата
    analysis_note = Column(Text, nullable=True)  # анализ ответа AI
    
    # Тип вопроса
    question_type = Column(String(50), nullable=False, default="main")  # "main" | "clarifying" | "dynamic"
        # main - основной вопрос (соответствует основным вопросам из шаблона)
        # clarifying - уточняющий вопрос (соответствует уточняющим вопросам из шаблона)
        # dynamic - динамический вопрос, созданный GPT (не из шаблона)
    
    is_clarifying = Column(Boolean, nullable=False, default=False)  # для обратной совместимости
    order_index = Column(Integer, nullable=False, default=0)  # порядок в сессии
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="question_answers")
    parent_session_qa = relationship("SessionQuestionAnswer", remote_side=[id], backref="child_answers")
    
    def __repr__(self):
        return f"<SessionQuestionAnswer(id={self.id}, session_id={self.session_id}, order={self.order_index})>"


class SessionTranscript(Base):
    """Session transcript messages"""
    __tablename__ = "session_transcripts"  # будет переименовано из transcript_messages через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    role = Column(String(10), nullable=False)  # 'ai' or 'user'
    message_text = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    audio_chunk_url = Column(String(1000), nullable=True)  # URL аудио chunk'а (для AI сообщений)
    order_index = Column(Integer, nullable=False, default=0)  # порядок в диалоге
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="transcript_messages")
    
    def __repr__(self):
        return f"<SessionTranscript(id={self.id}, role={self.role}, order={self.order_index})>"


class SessionEvaluation(Base):
    """Session evaluation - Evaluation results for concrete session"""
    __tablename__ = "session_evaluations"  # будет переименовано из evaluations через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), unique=True, nullable=False, index=True)
    overall_score = Column(Integer, nullable=False)  # финальный балл (0-100)
    summary = Column(Text, nullable=True)  # краткое резюме интервью
    readiness = Column(String(500), nullable=True)  # готовность к работе
    recommendation = Column(Text, nullable=True)  # рекомендация HR
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="evaluation")
    observations = relationship("SessionEvaluationObservation", back_populates="evaluation", cascade="all, delete-orphan")
    strengths = relationship("SessionEvaluationStrength", back_populates="evaluation", cascade="all, delete-orphan", order_by="SessionEvaluationStrength.order_index")
    improvements = relationship("SessionEvaluationImprovement", back_populates="evaluation", cascade="all, delete-orphan", order_by="SessionEvaluationImprovement.order_index")
    key_phrases = relationship("SessionEvaluationKeyPhrase", back_populates="evaluation", cascade="all, delete-orphan", order_by="SessionEvaluationKeyPhrase.order_index")
    
    def __repr__(self):
        return f"<SessionEvaluation(id={self.id}, session_id={self.session_id}, score={self.overall_score})>"


class SessionEvaluationObservation(Base):
    """Session evaluation observations by category"""
    __tablename__ = "session_evaluation_observations"  # будет переименовано из evaluation_observations через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("session_evaluations.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # stressHandling, empathy, problemSolving, conflictResolution, pacing, communication
    observation_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    evaluation = relationship("SessionEvaluation", back_populates="observations")
    
    def __repr__(self):
        return f"<SessionEvaluationObservation(id={self.id}, category={self.category})>"


class SessionEvaluationStrength(Base):
    """Session candidate strengths"""
    __tablename__ = "session_evaluation_strengths"  # будет переименовано из evaluation_strengths через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("session_evaluations.id"), nullable=False, index=True)
    strength_text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    evaluation = relationship("SessionEvaluation", back_populates="strengths")
    
    def __repr__(self):
        return f"<SessionEvaluationStrength(id={self.id}, evaluation_id={self.evaluation_id})>"


class SessionEvaluationImprovement(Base):
    """Session areas for improvement"""
    __tablename__ = "session_evaluation_improvements"  # будет переименовано из evaluation_improvements через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("session_evaluations.id"), nullable=False, index=True)
    improvement_text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    evaluation = relationship("SessionEvaluation", back_populates="improvements")
    
    def __repr__(self):
        return f"<SessionEvaluationImprovement(id={self.id}, evaluation_id={self.evaluation_id})>"


class SessionEvaluationKeyPhrase(Base):
    """Session key phrases from interview"""
    __tablename__ = "session_evaluation_key_phrases"  # будет переименовано из evaluation_key_phrases через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("session_evaluations.id"), nullable=False, index=True)
    phrase_type = Column(String(50), nullable=False)  # 'effective' or 'to_improve'
    phrase_text = Column(Text, nullable=False)
    note = Column(Text, nullable=True)  # пояснение к фразе
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    evaluation = relationship("SessionEvaluation", back_populates="key_phrases")
    
    def __repr__(self):
        return f"<SessionEvaluationKeyPhrase(id={self.id}, type={self.phrase_type})>"

