"""Result schemas - для совместимости с фронтендом"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.interview import TranscriptMessage


class SessionResult(BaseModel):
    """SessionResult schema - соответствует фронтенду types/index.ts"""
    id: str
    session_id: str = Field(alias="sessionId")
    student_id: Optional[str] = Field(None, alias="studentId")
    student_name: Optional[str] = Field(None, alias="studentName")
    student_email: Optional[str] = Field(None, alias="studentEmail")  # Расширение API
    started_at: datetime = Field(alias="startedAt")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")
    transcript: List[TranscriptMessage] = []
    summary: Optional[str] = None
    score: Optional[int] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True


class CandidateListResponse(BaseModel):
    """Response for candidates list"""
    results: List[SessionResult]
    total: int


class CandidateDetailResponse(BaseModel):
    """Detailed candidate evaluation response"""
    result: SessionResult
    evaluation: Optional[dict] = None  # Full evaluation details

