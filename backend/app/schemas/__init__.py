"""Pydantic schemas for data validation"""
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenData,
)
from app.schemas.session import (
    SessionParams,
    SessionCreate,
    SessionResponse,
    SessionListResponse,
    CustomerSimulation,
)
from app.schemas.interview import (
    TranscriptMessage,
    InterviewCreate,
    InterviewResponse,
    InterviewStart,
    InterviewComplete,
)
from app.schemas.evaluation import (
    EvaluationObservation,
    EvaluationStrength,
    EvaluationImprovement,
    EvaluationKeyPhrase,
    EvaluationResponse,
    AnalyzerResult,
    EvaluationResultResponse,
)
from app.schemas.result import (
    SessionResult,
    CandidateListResponse,
    CandidateDetailResponse,
)
from app.schemas.candidate import (
    CandidateStatusUpdate,
    CandidateStatusResponse,
)
from app.schemas.common import (
    ErrorResponse,
    SuccessResponse,
    PaginationParams,
    PaginatedResponse,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "TokenData",
    # Session
    "SessionParams",
    "SessionCreate",
    "SessionResponse",
    "SessionListResponse",
    "CustomerSimulation",
    # Interview
    "TranscriptMessage",
    "InterviewCreate",
    "InterviewResponse",
    "InterviewStart",
    "InterviewComplete",
    # Evaluation
    "EvaluationObservation",
    "EvaluationStrength",
    "EvaluationImprovement",
    "EvaluationKeyPhrase",
    "EvaluationResponse",
    "AnalyzerResult",
    "EvaluationResultResponse",
    # Result
    "SessionResult",
    "CandidateListResponse",
    "CandidateDetailResponse",
    # Candidate
    "CandidateStatusUpdate",
    "CandidateStatusResponse",
    # Common
    "ErrorResponse",
    "SuccessResponse",
    "PaginationParams",
    "PaginatedResponse",
]
