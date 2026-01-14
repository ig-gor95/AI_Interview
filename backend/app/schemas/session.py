"""Session Pydantic schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.session import Difficulty, Language, Personality, InterviewType


class CustomerSimulation(BaseModel):
    """Customer simulation configuration"""
    enabled: bool = False
    scenario: Optional[str] = None
    role: Optional[str] = None


class SessionParams(BaseModel):
    """Session parameters schema - соответствует фронтенду"""
    topic: Optional[str] = None
    difficulty: Difficulty = Difficulty.INTERMEDIATE
    duration: int = 30
    language: Language = Language.RU
    goals: List[str] = Field(default_factory=list)
    personality: Personality = Personality.PROFESSIONAL
    role_context: Optional[str] = Field(None, alias="roleContext")
    context_description: Optional[str] = Field(None, alias="contextDescription")
    evaluation_criteria: Optional[List[str]] = Field(None, alias="evaluationCriteria")
    expected_knowledge: Optional[str] = Field(None, alias="expectedKnowledge")
    interaction_style: Optional[str] = Field(None, alias="interactionStyle")  # questions, practice, theory, mixed
    focus_areas: Optional[List[str]] = Field(None, alias="focusAreas")
    additional_instructions: Optional[str] = Field(None, alias="additionalInstructions")
    
    # HR-интервью поля
    position: Optional[str] = None
    company: Optional[str] = None
    requirements: Optional[List[str]] = None
    interview_type: Optional[InterviewType] = Field(None, alias="interviewType")
    passing_score: Optional[int] = Field(None, alias="passingScore")
    
    # Вопросы
    questions: Optional[List[str]] = None
    
    # Симуляция
    customer_simulation: Optional[CustomerSimulation] = Field(None, alias="customerSimulation")
    
    class Config:
        populate_by_name = True  # Позволяет использовать и snake_case и camelCase


class SessionCreate(BaseModel):
    """Schema for creating a session"""
    params: SessionParams


class SessionResponse(BaseModel):
    """Schema for session response"""
    id: str
    organizer_id: str = Field(alias="organizerId")
    organizer_name: str = Field(alias="organizerName")
    params: SessionParams
    share_url: str = Field(alias="shareUrl")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class SessionListResponse(BaseModel):
    """Schema for list of sessions"""
    sessions: List[SessionResponse]
    total: int

