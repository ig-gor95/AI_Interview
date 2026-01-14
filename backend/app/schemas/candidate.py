"""Candidate status schemas"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.candidate import CandidateStatusType


class CandidateStatusUpdate(BaseModel):
    """Schema for updating candidate status"""
    status: CandidateStatusType
    notes: Optional[str] = None


class CandidateStatusResponse(BaseModel):
    """Candidate status response"""
    id: str
    interview_id: str
    status: CandidateStatusType
    notes: Optional[str] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True

