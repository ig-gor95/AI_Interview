"""Result schemas - для совместимости с фронтендом"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from app.schemas.interview import TranscriptMessage


# Quality rating type matching frontend
QualityRating = Literal['outstanding', 'strong', 'promising', 'suitable']
RecommendationStatus = Literal['recommended', 'questionable', 'not-recommended']
EvaluationStatusType = Literal['pending', 'in_progress', 'completed', 'failed']


class CriterionResultResponse(BaseModel):
    """Per-criterion evaluation result - passes/fails with fact from candidate answers"""
    criterion_id: str = Field(alias="criterionId")
    criterion_name: str = Field(alias="criterionName")
    passes: bool
    fact: Optional[str] = None
    justification: Optional[str] = None
    score: Optional[int] = None

    class Config:
        populate_by_name = True


class SessionResult(BaseModel):
    """SessionResult schema - соответствует фронтенду types/index.ts"""
    id: str
    session_id: str = Field(alias="sessionId")
    student_id: Optional[str] = Field(None, alias="studentId")
    student_name: Optional[str] = Field(None, alias="studentName")
    student_email: Optional[str] = Field(None, alias="studentEmail")
    started_at: datetime = Field(alias="startedAt")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")
    transcript: List[TranscriptMessage] = []
    transcript_count: Optional[int] = Field(None, alias="transcriptCount")
    summary: Optional[str] = None
    score: Optional[int] = None
    quality_rating: Optional[QualityRating] = Field(None, alias="qualityRating")
    evaluation_status: EvaluationStatusType = Field(default='pending', alias="evaluationStatus")

    class Config:
        from_attributes = True
        populate_by_name = True


class CandidateStatisticsResponse(BaseModel):
    """Statistics response for organizer dashboard"""
    total_interviews: int = Field(alias="totalInterviews")
    completed_candidates: int = Field(alias="completedCandidates")
    recommended_percentage: int = Field(alias="recommendedPercentage")
    
    class Config:
        populate_by_name = True


class CandidateListItemResponse(BaseModel):
    """Candidate list item - simplified version for list view (no transcript)"""
    id: str
    session_id: str = Field(alias="sessionId")
    student_id: Optional[str] = Field(None, alias="studentId")
    student_name: Optional[str] = Field(None, alias="studentName")
    student_email: Optional[str] = Field(None, alias="studentEmail")
    started_at: Optional[datetime] = Field(None, alias="startedAt")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")
    score: Optional[int] = None
    quality_rating: Optional[QualityRating] = Field(None, alias="qualityRating")
    summary: Optional[str] = None
    recommendation_status: RecommendationStatus = Field(alias="recommendationStatus")
    transcript_count: Optional[int] = Field(None, alias="transcriptCount")
    user_message_count: Optional[int] = Field(None, alias="userMessageCount")
    position: Optional[str] = None
    evaluation_status: EvaluationStatusType = Field(default='pending', alias="evaluationStatus")

    class Config:
        populate_by_name = True


class CandidateListResponse(BaseModel):
    """Response for candidates list - lightweight items without transcript"""
    results: List[CandidateListItemResponse]
    total: int


class CandidateDetailResponse(BaseModel):
    """Detailed candidate evaluation response"""
    result: SessionResult
    evaluation: Optional[dict] = None  # Full evaluation details
    interview: Optional[dict] = None  # position, company, questions for display

