"""Session models - Interview templates created by HR"""
from sqlalchemy import Column, String, Integer, Enum, Boolean, DateTime, ForeignKey, Text, JSON
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


class Session(Base):
    """Session model - Interview template created by HR"""
    __tablename__ = "sessions"
    
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
    questions = relationship("SessionQuestion", back_populates="session", cascade="all, delete-orphan")
    evaluation_criteria = relationship("SessionEvaluationCriterion", back_populates="session", cascade="all, delete-orphan")
    requirements = relationship("SessionRequirement", back_populates="session", cascade="all, delete-orphan")
    config = relationship("SessionConfig", back_populates="session", uselist=False, cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="session")
    
    def __repr__(self):
        return f"<Session(id={self.id}, position={self.position}, organizer_id={self.organizer_id})>"


class SessionQuestion(Base):
    """Session questions"""
    __tablename__ = "session_questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="questions")
    
    def __repr__(self):
        return f"<SessionQuestion(id={self.id}, session_id={self.session_id}, order={self.order_index})>"


class SessionEvaluationCriterion(Base):
    """Session evaluation criteria"""
    __tablename__ = "session_evaluation_criteria"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    criterion_name = Column(String(255), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="evaluation_criteria")
    
    def __repr__(self):
        return f"<SessionEvaluationCriterion(id={self.id}, criterion={self.criterion_name})>"


class SessionRequirement(Base):
    """Session requirements for candidate"""
    __tablename__ = "session_requirements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    requirement_text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="requirements")
    
    def __repr__(self):
        return f"<SessionRequirement(id={self.id}, session_id={self.session_id})>"


class SessionConfig(Base):
    """Additional session configuration (JSONB for flexibility)"""
    __tablename__ = "session_config"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), unique=True, nullable=False, index=True)
    goals = Column(JSONB, nullable=True)  # массив целей
    role_context = Column(Text, nullable=True)
    context_description = Column(Text, nullable=True)
    expected_knowledge = Column(Text, nullable=True)
    interaction_style = Column(String(50), nullable=True)  # questions, practice, theory, mixed
    focus_areas = Column(JSONB, nullable=True)  # массив областей фокуса
    additional_instructions = Column(Text, nullable=True)
    customer_simulation = Column(JSONB, nullable=True)  # объект с enabled, scenario, role
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="config")
    
    def __repr__(self):
        return f"<SessionConfig(id={self.id}, session_id={self.session_id})>"

