"""MCP Server for AI Interview System.

Provides tools for managing interviews, sessions, candidates, and evaluations.
Run: python -m mcp_server.server
"""
import sys
import asyncio
from pathlib import Path
from typing import Optional

# Ensure backend is on path for model imports
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from mcp.server.fastmcp import FastMCP

# Initialize MCP server
mcp = FastMCP(
    "AI Interview",
    instructions=(
        "MCP server for AI HR Interview System. "
        "Manage interview templates, candidate sessions, evaluations, and analytics. "
        "Use list_interviews to see all templates, get_session_details for full candidate data, "
        "and run_analytics_query for custom SQL analysis."
    ),
)


# ─── Interview Management Tools ────────────────────────────────────────────

@mcp.tool()
async def list_interviews(
    is_active: Optional[bool] = None,
    organizer_email: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> str:
    """List all interview templates with basic info.

    Args:
        is_active: Filter by active status (true/false/null for all)
        organizer_email: Filter by organizer email
        limit: Max results (default 50)
        offset: Skip first N results
    """
    from mcp_server.tools.interviews import list_interviews as _impl
    return await _impl(is_active, organizer_email, limit, offset)


@mcp.tool()
async def get_interview(interview_id: str) -> str:
    """Get full interview details including questions, criteria, requirements, config.

    Args:
        interview_id: UUID of the interview template
    """
    from mcp_server.tools.interviews import get_interview as _impl
    return await _impl(interview_id)


@mcp.tool()
async def create_interview(
    organizer_email: str,
    position: str,
    duration: int,
    questions: list[dict],
    title: Optional[str] = None,
    company: Optional[str] = None,
    difficulty: str = "intermediate",
    language: str = "ru",
    personality: str = "professional",
    interview_type: Optional[str] = None,
    passing_score: Optional[int] = None,
    evaluation_criteria: Optional[list[str]] = None,
    requirements: Optional[list[str]] = None,
    allow_dynamic_questions: bool = False,
    goals: Optional[list[str]] = None,
    additional_instructions: Optional[str] = None,
) -> str:
    """Create a new interview template with questions, criteria, and config.

    Args:
        organizer_email: Email of the organizer (must exist in DB)
        position: Job position name (e.g. "Python Developer")
        duration: Interview duration in minutes
        questions: List of question objects: [{"text": "question text", "clarifying": ["sub-q1", "sub-q2"]}]
        title: Interview title
        company: Company name
        difficulty: beginner/intermediate/advanced (default: intermediate)
        language: ru/en (default: ru)
        personality: friendly/professional/motivating (default: professional)
        interview_type: screening/technical/behavioral/mixed
        passing_score: Minimum passing score 0-100
        evaluation_criteria: List of criteria names e.g. ["communication", "technical_skills"]
        requirements: List of job requirements
        allow_dynamic_questions: Let AI generate additional questions (default: false)
        goals: Interview goals
        additional_instructions: Extra instructions for AI interviewer
    """
    from mcp_server.tools.interviews import create_interview as _impl
    return await _impl(
        organizer_email, position, duration, questions, title, company,
        difficulty, language, personality, interview_type, passing_score,
        evaluation_criteria, requirements, allow_dynamic_questions,
        goals, additional_instructions,
    )


@mcp.tool()
async def update_interview(
    interview_id: str,
    title: Optional[str] = None,
    position: Optional[str] = None,
    company: Optional[str] = None,
    duration: Optional[int] = None,
    is_active: Optional[bool] = None,
    passing_score: Optional[int] = None,
) -> str:
    """Update interview template fields.

    Args:
        interview_id: UUID of the interview
        title: New title
        position: New position
        company: New company
        duration: New duration in minutes
        is_active: Activate/deactivate interview
        passing_score: New passing score (0-100)
    """
    from mcp_server.tools.interviews import update_interview as _impl
    return await _impl(interview_id, title, position, company, duration, is_active, passing_score)


@mcp.tool()
async def generate_interview_link(
    interview_id: str,
    expires_hours: Optional[int] = None,
) -> str:
    """Generate a shareable link for candidates to access the interview.

    Args:
        interview_id: UUID of the interview
        expires_hours: Link expiration in hours (null = no expiration)
    """
    from mcp_server.tools.interviews import generate_interview_link as _impl
    return await _impl(interview_id, expires_hours)


@mcp.tool()
async def list_interview_links(interview_id: str) -> str:
    """List all shareable links for an interview.

    Args:
        interview_id: UUID of the interview
    """
    from mcp_server.tools.interviews import list_interview_links as _impl
    return await _impl(interview_id)


# ─── Session & Candidate Tools ─────────────────────────────────────────────

@mcp.tool()
async def list_sessions(
    interview_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> str:
    """List interview sessions with candidate info and scores.

    Args:
        interview_id: Filter by interview template UUID
        status: Filter by status (pending/in_progress/completed/abandoned)
        limit: Max results (default 50)
        offset: Skip first N results
    """
    from mcp_server.tools.sessions import list_sessions as _impl
    return await _impl(interview_id, status, limit, offset)


@mcp.tool()
async def get_session_details(session_id: str) -> str:
    """Get full session details: transcript, Q&A, evaluation, interview info.

    Args:
        session_id: UUID of the session
    """
    from mcp_server.tools.sessions import get_session_details as _impl
    return await _impl(session_id)


@mcp.tool()
async def get_session_transcript(session_id: str) -> str:
    """Get transcript messages for a session (just the dialog).

    Args:
        session_id: UUID of the session
    """
    from mcp_server.tools.sessions import get_session_transcript as _impl
    return await _impl(session_id)


@mcp.tool()
async def update_candidate_status(
    session_id: str,
    status: str,
    notes: Optional[str] = None,
) -> str:
    """Update candidate HR status for a session.

    Args:
        session_id: UUID of the session
        status: New status (new/reviewed/shortlisted/rejected)
        notes: HR notes about the candidate
    """
    from mcp_server.tools.sessions import update_candidate_status as _impl
    return await _impl(session_id, status, notes)


# ─── Evaluation & Analytics Tools ──────────────────────────────────────────

@mcp.tool()
async def get_evaluation(session_id: str) -> str:
    """Get full evaluation report for a completed session.

    Returns score, quality rating, recommendation, strengths, improvements, key phrases.

    Args:
        session_id: UUID of the session
    """
    from mcp_server.tools.evaluations import get_evaluation as _impl
    return await _impl(session_id)


@mcp.tool()
async def get_candidates_summary(
    interview_id: Optional[str] = None,
    min_score: Optional[int] = None,
    max_score: Optional[int] = None,
    candidate_status: Optional[str] = None,
    recommendation: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> str:
    """Get candidates list with scores and filters for recruiter review.

    Args:
        interview_id: Filter by interview template UUID
        min_score: Minimum evaluation score (0-100)
        max_score: Maximum evaluation score (0-100)
        candidate_status: Filter by HR status (new/reviewed/shortlisted/rejected)
        recommendation: Filter by recommendation (recommended/questionable/not-recommended)
        limit: Max results
        offset: Skip first N results
    """
    from mcp_server.tools.evaluations import get_candidates_summary as _impl
    return await _impl(interview_id, min_score, max_score, candidate_status, recommendation, limit, offset)


@mcp.tool()
async def get_interview_statistics(interview_id: Optional[str] = None) -> str:
    """Get aggregate statistics: session counts, average scores, recommendation rates.

    Args:
        interview_id: Optional UUID for specific interview stats. Null for global stats.
    """
    from mcp_server.tools.evaluations import get_interview_statistics as _impl
    return await _impl(interview_id)


@mcp.tool()
async def run_analytics_query(sql: str) -> str:
    """Run a read-only SELECT SQL query for custom analytics.

    Only SELECT/WITH queries allowed. Max 500 rows returned.
    See tool description for available table schemas.

    Args:
        sql: SQL SELECT query to execute
    """
    from mcp_server.tools.analytics import run_analytics_query as _impl
    return await _impl(sql)


# ─── Entry Point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run(transport="stdio")
