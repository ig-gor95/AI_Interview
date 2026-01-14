"""Database models"""
from app.models.user import User, UserRole
from app.models.session import (
    Session,
    SessionQuestion,
    SessionEvaluationCriterion,
    SessionRequirement,
    SessionConfig,
    Difficulty,
    Language,
    Personality,
    InterviewType,
)
from app.models.interview import (
    Interview,
    TranscriptMessage,
    QuestionAnswer,
    InterviewStatus,
)
from app.models.evaluation import (
    Evaluation,
    EvaluationObservation,
    EvaluationStrength,
    EvaluationImprovement,
    EvaluationKeyPhrase,
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
    # Session
    "Session",
    "SessionQuestion",
    "SessionEvaluationCriterion",
    "SessionRequirement",
    "SessionConfig",
    "Difficulty",
    "Language",
    "Personality",
    "InterviewType",
    # Interview
    "Interview",
    "TranscriptMessage",
    "QuestionAnswer",
    "InterviewStatus",
    # Evaluation
    "Evaluation",
    "EvaluationObservation",
    "EvaluationStrength",
    "EvaluationImprovement",
    "EvaluationKeyPhrase",
    # Simulation
    "SimulationScenario",
    "SimulationDialog",
    # Candidate
    "CandidateStatus",
    "CandidateStatusType",
]
