"""Interview Pydantic schemas - Legacy schemas, kept for backward compatibility"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.session import SessionStatus


class TranscriptMessage(BaseModel):
    """Transcript message schema"""
    role: str  # 'ai' or 'user'
    message: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


class InterviewCreate(BaseModel):
    """Schema for creating an interview"""
    session_id: str
    candidate_name: str
    candidate_email: Optional[str] = None


class InterviewResponse(BaseModel):
    """Schema for interview response"""
    id: str
    session_id: str
    candidate_id: Optional[str] = None
    candidate_name: str
    candidate_email: Optional[str] = None
    status: SessionStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class InterviewStart(BaseModel):
    """Schema for starting an interview"""
    interview_id: str


class InterviewComplete(BaseModel):
    """Schema for completing an interview"""
    interview_id: str

