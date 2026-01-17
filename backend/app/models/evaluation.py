"""Evaluation models - Candidate evaluation results"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


# Note: Evaluation models are now in session.py as SessionEvaluation
# This file is kept for backward compatibility but should be removed after migration
    observations = relationship("EvaluationObservation", back_populates="evaluation", cascade="all, delete-orphan")
    strengths = relationship("EvaluationStrength", back_populates="evaluation", cascade="all, delete-orphan", order_by="EvaluationStrength.order_index")
    improvements = relationship("EvaluationImprovement", back_populates="evaluation", cascade="all, delete-orphan", order_by="EvaluationImprovement.order_index")
    key_phrases = relationship("EvaluationKeyPhrase", back_populates="evaluation", cascade="all, delete-orphan", order_by="EvaluationKeyPhrase.order_index")
    
    def __repr__(self):
        return f"<Evaluation(id={self.id}, interview_id={self.interview_id}, score={self.overall_score})>"


class EvaluationObservation(Base):
    """Evaluation observations by category"""
    __tablename__ = "evaluation_observations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # stressHandling, empathy, problemSolving, conflictResolution, pacing, communication
    observation_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    evaluation = relationship("Evaluation", back_populates="observations")
    
    def __repr__(self):
        return f"<EvaluationObservation(id={self.id}, category={self.category})>"


class EvaluationStrength(Base):
    """Candidate strengths"""
    __tablename__ = "evaluation_strengths"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id"), nullable=False, index=True)
    strength_text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    evaluation = relationship("Evaluation", back_populates="strengths")
    
    def __repr__(self):
        return f"<EvaluationStrength(id={self.id}, evaluation_id={self.evaluation_id})>"


class EvaluationImprovement(Base):
    """Areas for improvement"""
    __tablename__ = "evaluation_improvements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id"), nullable=False, index=True)
    improvement_text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    evaluation = relationship("Evaluation", back_populates="improvements")
    
    def __repr__(self):
        return f"<EvaluationImprovement(id={self.id}, evaluation_id={self.evaluation_id})>"


class EvaluationKeyPhrase(Base):
    """Key phrases from interview"""
    __tablename__ = "evaluation_key_phrases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id"), nullable=False, index=True)
    phrase_type = Column(String(50), nullable=False)  # 'effective' or 'to_improve'
    phrase_text = Column(Text, nullable=False)
    note = Column(Text, nullable=True)  # пояснение к фразе
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    evaluation = relationship("Evaluation", back_populates="key_phrases")
    
    def __repr__(self):
        return f"<EvaluationKeyPhrase(id={self.id}, type={self.phrase_type})>"

