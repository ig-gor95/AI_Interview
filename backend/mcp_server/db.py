"""Database connection for MCP server - standalone async SQLAlchemy setup."""
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Add backend to path so we can import app.models
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.database import Base
from app.config import settings

# Import all models to register them with Base.metadata
from app.models import (  # noqa: F401
    User, Interview, InterviewQuestion, InterviewEvaluationCriterion,
    InterviewRequirement, InterviewConfig, InterviewLink,
    Session, SessionQuestionAnswer, SessionTranscript,
    SessionEvaluation, SessionEvaluationObservation,
    SessionEvaluationStrength, SessionEvaluationImprovement,
    SessionEvaluationKeyPhrase, CandidateStatus,
    SimulationScenario, SimulationDialog,
)

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@asynccontextmanager
async def get_session():
    """Async context manager for database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
