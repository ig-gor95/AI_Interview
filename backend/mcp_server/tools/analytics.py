"""Analytics and custom SQL query MCP tools."""
import json
import re

from sqlalchemy import text

from mcp_server.db import get_session


async def run_analytics_query(sql: str) -> str:
    """Run a read-only SQL query against the database for custom analytics.

    Only SELECT queries are allowed. INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE are blocked.

    Available tables:
    - users (id, email, name, role, created_at)
    - interviews (id, organizer_id, title, position, company, difficulty, duration, language, personality, interview_type, passing_score, share_url, is_active, created_at)
    - interview_questions (id, interview_id, question_text, order_index, parent_question_id)
    - interview_evaluation_criteria (id, interview_id, criterion_name, order_index)
    - interview_requirements (id, interview_id, requirement_text, order_index)
    - interview_config (id, interview_id, goals, role_context, context_description, expected_knowledge, interaction_style, focus_areas, additional_instructions, customer_simulation, allow_dynamic_questions)
    - interview_links (id, interview_id, token, is_used, expires_at, session_id, created_at)
    - sessions (id, interview_id, candidate_id, candidate_name, candidate_email, candidate_surname, status, started_at, completed_at, created_at)
    - session_question_answers (id, session_id, parent_session_qa_id, question_text, answer_text, analysis_note, question_type, is_clarifying, order_index)
    - session_transcripts (id, session_id, role, message_text, timestamp, audio_chunk_url, order_index)
    - session_evaluations (id, session_id, overall_score, summary, readiness, recommendation, created_at)
    - session_evaluation_observations (id, evaluation_id, category, observation_text)
    - session_evaluation_strengths (id, evaluation_id, strength_text, order_index)
    - session_evaluation_improvements (id, evaluation_id, improvement_text, order_index)
    - session_evaluation_key_phrases (id, evaluation_id, phrase_type, phrase_text, note, order_index)
    - candidate_status (id, session_id, status, notes, updated_at)
    - simulation_scenarios (id, interview_id, session_id, scenario_type, scenario_description, client_role, client_behavior)
    - simulation_dialog (id, scenario_id, role, message_text, tone, order_index, timestamp)

    Args:
        sql: SELECT SQL query to execute
    """
    # Security: only allow SELECT
    normalized = sql.strip().upper()
    forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE"]
    for kw in forbidden:
        if re.search(rf'\b{kw}\b', normalized):
            return json.dumps({"error": f"Only SELECT queries are allowed. Found forbidden keyword: {kw}"})

    if not normalized.startswith("SELECT") and not normalized.startswith("WITH"):
        return json.dumps({"error": "Query must start with SELECT or WITH"})

    async with get_session() as db:
        try:
            result = await db.execute(text(sql))
            rows = result.fetchall()
            columns = list(result.keys())

            data = []
            for row in rows[:500]:  # Limit to 500 rows
                data.append({col: _serialize_value(row[i]) for i, col in enumerate(columns)})

            return json.dumps({
                "columns": columns,
                "rows": data,
                "total_rows": len(rows),
                "truncated": len(rows) > 500,
            }, ensure_ascii=False, default=str)
        except Exception as e:
            return json.dumps({"error": str(e)})


def _serialize_value(val):
    """Convert DB values to JSON-safe types."""
    if val is None:
        return None
    if hasattr(val, "isoformat"):
        return val.isoformat()
    if hasattr(val, "hex"):
        return str(val)
    return val
