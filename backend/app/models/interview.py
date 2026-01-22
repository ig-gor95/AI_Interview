"""Interview models - Interview templates created by HR"""
from sqlalchemy import Column, String, Integer, Enum, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base


class Difficulty(str, enum.Enum):
    """Difficulty level enum"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Language(str, enum.Enum):
    """Language enum"""
    RU = "ru"
    EN = "en"


class Personality(str, enum.Enum):
    """AI personality enum"""
    FRIENDLY = "friendly"
    PROFESSIONAL = "professional"
    MOTIVATING = "motivating"


class InterviewType(str, enum.Enum):
    """Interview type enum"""
    SCREENING = "screening"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    MIXED = "mixed"


class Interview(Base):
    """Interview model - Interview template created by HR"""
    __tablename__ = "interviews"  # будет переименовано из sessions через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(500), nullable=True)  # topic
    position = Column(String(500), nullable=True)  # название вакансии
    company = Column(String(255), nullable=True)
    difficulty = Column(Enum(Difficulty), nullable=False, default=Difficulty.INTERMEDIATE)
    duration = Column(Integer, nullable=False)  # в минутах
    language = Column(Enum(Language), nullable=False, default=Language.RU)
    personality = Column(Enum(Personality), nullable=False, default=Personality.PROFESSIONAL)
    interview_type = Column(Enum(InterviewType), nullable=True)
    passing_score = Column(Integer, nullable=True)  # минимальный проходной балл
    share_url = Column(String(500), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    questions = relationship("InterviewQuestion", back_populates="interview", cascade="all, delete-orphan")
    evaluation_criteria = relationship("InterviewEvaluationCriterion", back_populates="interview", cascade="all, delete-orphan")
    requirements = relationship("InterviewRequirement", back_populates="interview", cascade="all, delete-orphan")
    config = relationship("InterviewConfig", back_populates="interview", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="interview")  # множество сессий для одного шаблона
    links = relationship("InterviewLink", back_populates="interview", cascade="all, delete-orphan")
    simulation_scenarios = relationship("SimulationScenario", back_populates="interview", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Interview(id={self.id}, position={self.position}, organizer_id={self.organizer_id})>"


class InterviewQuestion(Base):
    """Interview questions - Template questions for interview"""
    __tablename__ = "interview_questions"  # будет переименовано из session_questions через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)  # инструкция для GPT
    order_index = Column(Integer, nullable=False, default=0)
    parent_question_id = Column(UUID(as_uuid=True), ForeignKey("interview_questions.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="questions")
    parent_question = relationship("InterviewQuestion", remote_side=[id], backref="clarifying_questions")
    
    def __repr__(self):
        return f"<InterviewQuestion(id={self.id}, interview_id={self.interview_id}, order={self.order_index})>"


class InterviewEvaluationCriterion(Base):
    """Interview evaluation criteria"""
    __tablename__ = "interview_evaluation_criteria"  # будет переименовано из session_evaluation_criteria через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, index=True)
    criterion_name = Column(String(255), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="evaluation_criteria")
    
    def __repr__(self):
        return f"<InterviewEvaluationCriterion(id={self.id}, criterion={self.criterion_name})>"


class InterviewRequirement(Base):
    """Interview requirements for candidate"""
    __tablename__ = "interview_requirements"  # будет переименовано из session_requirements через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, index=True)
    requirement_text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="requirements")
    
    def __repr__(self):
        return f"<InterviewRequirement(id={self.id}, interview_id={self.interview_id})>"


class InterviewConfig(Base):
    """Interview configuration"""
    __tablename__ = "interview_config"  # будет переименовано из session_config через миграцию
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), unique=True, nullable=False, index=True)
    goals = Column(JSONB, nullable=True)  # массив целей
    role_context = Column(Text, nullable=True)
    context_description = Column(Text, nullable=True)
    expected_knowledge = Column(Text, nullable=True)
    interaction_style = Column(String(50), nullable=True)  # questions, practice, theory, mixed
    focus_areas = Column(JSONB, nullable=True)  # массив областей фокуса
    additional_instructions = Column(Text, nullable=True)
    customer_simulation = Column(JSONB, nullable=True)  # объект с enabled, scenario, role
    allow_dynamic_questions = Column(Boolean, nullable=True, default=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="config")
    
    def __repr__(self):
        return f"<InterviewConfig(id={self.id}, interview_id={self.interview_id})>"


class InterviewLink(Base):
    """Interview link for candidate access"""
    __tablename__ = "interview_links"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False, index=True)  # уникальный токен для URL
    is_used = Column(Boolean, default=False, nullable=False)  # использована ли ссылка
    expires_at = Column(DateTime(timezone=True), nullable=True)  # срок действия
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True, index=True)  # созданная сессия после регистрации
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="links")
    session = relationship("Session", foreign_keys=[session_id], back_populates="link")
    
    def __repr__(self):
        return f"<InterviewLink(id={self.id}, interview_id={self.interview_id}, token={self.token})>"
