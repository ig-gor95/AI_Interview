"""Session Pydantic schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.interview import Difficulty, Language, Personality, InterviewType


class CustomerSimulation(BaseModel):
    """Customer simulation configuration"""
    enabled: bool = False
    scenario: Optional[str] = None
    role: Optional[str] = None


class Question(BaseModel):
    """Question with clarifying questions"""
    text: str
    clarifying_questions: Optional[List[str]] = Field(
        None,
        alias="clarifyingQuestions",
        description="Дочерние вопросы для уточнения"
    )
    
    class Config:
        populate_by_name = True


class SessionParams(BaseModel):
    """Session parameters schema - только поля из формы"""
    # Информация о вакансии
    position: str  # Название вакансии (обязательное)
    company: Optional[str] = None  # Название компании (опциональное)
    
    # Базовые вопросы для первичного отбора
    questions: List[Question]  # Вопросы с возможностью уточняющих вопросов (обязательное)
    
    # Дополнительные вопросы на усмотрение робота
    allow_dynamic_questions: Optional[bool] = Field(
        None,
        alias="allowDynamicQuestions",
        description="Робот может задавать дополнительные вопросы"
    )
    
    # Моделирование реальной рабочей ситуации
    customer_simulation: Optional[CustomerSimulation] = Field(None, alias="customerSimulation")
    
    class Config:
        populate_by_name = True


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


# GPT Interaction Schemas

class InterviewContext(BaseModel):
    """Interview template context for GPT"""
    id: str
    topic: Optional[str] = None
    position: str
    company: Optional[str] = None
    language: str
    personality: str
    duration: int
    instructions: Optional[str] = None
    allow_dynamic_questions: bool = Field(alias="allowDynamicQuestions", default=False)
    customer_simulation: Optional[CustomerSimulation] = Field(None, alias="customerSimulation")
    
    class Config:
        populate_by_name = True


class InterviewQuestionContext(BaseModel):
    """Current interview question context for GPT"""
    id: str
    text: str
    order_index: int = Field(alias="orderIndex")
    clarifying_instructions: Optional[List[str]] = Field(None, alias="clarifyingInstructions")
    clarifying_questions: Optional[List[str]] = Field(None, alias="clarifyingQuestions")
    
    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    """User response in conversation"""
    text: str
    timestamp: datetime


class RemainingTime(BaseModel):
    """Remaining time in session"""
    minutes: int
    seconds: int = 0


class ConversationMessage(BaseModel):
    """Message in conversation history"""
    role: str  # 'ai' or 'user'
    message: str
    timestamp: datetime


class QuestionProgress(BaseModel):
    """Question progress in session"""
    current_question_index: int = Field(alias="currentQuestionIndex")
    total_questions: int = Field(alias="totalQuestions")
    answered_questions: int = Field(alias="answeredQuestions")
    
    class Config:
        populate_by_name = True


class SessionQuestionAnswerSummary(BaseModel):
    """Summary of session question-answer for context"""
    question_text: str = Field(alias="questionText")
    answer_text: str = Field(alias="answerText")
    question_type: str = Field(alias="questionType")  # "main" | "clarifying" | "dynamic"
    parent_session_question_answer_id: Optional[str] = Field(None, alias="parentSessionQuestionAnswerId")
    
    class Config:
        populate_by_name = True


class GPTContextRequest(BaseModel):
    """Context request for GPT API"""
    interview: InterviewContext
    current_interview_question: Optional[InterviewQuestionContext] = Field(None, alias="currentInterviewQuestion")
    user_response: Optional[UserResponse] = Field(None, alias="userResponse")
    remaining_time: RemainingTime = Field(alias="remainingTime")
    conversation_history: List[ConversationMessage] = Field(alias="conversationHistory")
    question_progress: QuestionProgress = Field(alias="questionProgress")
    session_history: List[SessionQuestionAnswerSummary] = Field(alias="sessionHistory")
    allow_dynamic_questions: bool = Field(alias="allowDynamicQuestions", default=False)
    simulation_done: bool = Field(alias="simulationDone", default=False)
    
    class Config:
        populate_by_name = True


class QuestionResponse(BaseModel):
    """GPT question response"""
    text: str
    type: str  # "main" | "clarifying" | "dynamic"
    is_clarifying: bool = Field(alias="isClarifying", default=False)
    is_dynamic: bool = Field(alias="isDynamic", default=False)
    parent_session_question_answer_id: Optional[str] = Field(None, alias="parentSessionQuestionAnswerId")
    
    class Config:
        populate_by_name = True


class QuestionMetadata(BaseModel):
    """Metadata about the question"""
    needs_clarification: bool = Field(alias="needsClarification", default=False)
    answer_quality: str = Field(alias="answerQuality", default="complete")  # "complete" | "partial" | "insufficient"
    should_move_next: bool = Field(alias="shouldMoveNext", default=False)
    estimated_time_remaining: Optional[int] = Field(None, alias="estimatedTimeRemaining")
    
    class Config:
        populate_by_name = True


class QuestionAnalysis(BaseModel):
    """Analysis of the conversation"""
    key_points: List[str] = Field(alias="keyPoints", default_factory=list)
    suggested_follow_ups: List[str] = Field(alias="suggestedFollowUps", default_factory=list)
    
    class Config:
        populate_by_name = True


class GPTResponse(BaseModel):
    """Response from GPT API"""
    question: QuestionResponse
    metadata: QuestionMetadata
    analysis: Optional[QuestionAnalysis] = None
    
    class Config:
        populate_by_name = True


