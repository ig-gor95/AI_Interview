"""Database models"""
from app.models.user import User, UserRole
from app.models.interview import (
    Interview,
    InterviewQuestion,
    InterviewEvaluationCriterion,
    InterviewRequirement,
    InterviewConfig,
    InterviewLink,
    Difficulty,
    Language,
    Personality,
    InterviewType,
)
from app.models.session import (
    Session,
    SessionQuestionAnswer,
    SessionTranscript,
    SessionEvaluation,
    SessionEvaluationObservation,
    SessionEvaluationStrength,
    SessionEvaluationImprovement,
    SessionEvaluationKeyPhrase,
    SessionStatus,
)
from app.models.simulation import (
    SimulationScenario,
    SimulationDialog,
)
from app.models.candidate import (
    CandidateStatus,
    CandidateStatusType,
)

__all__ = [
    # User
    "User",
    "UserRole",
    # Interview (шаблон интервью)
    "Interview",
    "InterviewQuestion",
    "InterviewEvaluationCriterion",
    "InterviewRequirement",
    "InterviewConfig",
    "InterviewLink",
    "Difficulty",
    "Language",
    "Personality",
    "InterviewType",
    # Session (конкретная сессия)
    "Session",
    "SessionQuestionAnswer",
    "SessionTranscript",
    "SessionEvaluation",
    "SessionEvaluationObservation",
    "SessionEvaluationStrength",
    "SessionEvaluationImprovement",
    "SessionEvaluationKeyPhrase",
    "SessionStatus",
    # Simulation
    "SimulationScenario",
    "SimulationDialog",
    # Candidate
    "CandidateStatus",
    "CandidateStatusType",
]
