"""Candidate status model"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database import Base


class CandidateStatusType(str, enum.Enum):
    """Candidate status enum"""
    NEW = "new"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"


class CandidateStatus(Base):
    """Candidate status for HR"""
    __tablename__ = "candidate_status"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), unique=True, nullable=False, index=True)
    status = Column(Enum(CandidateStatusType), nullable=False, default=CandidateStatusType.NEW, index=True)
    notes = Column(Text, nullable=True)  # заметки HR
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="candidate_status")
    
    def __repr__(self):
        return f"<CandidateStatus(id={self.id}, interview_id={self.interview_id}, status={self.status})>"

