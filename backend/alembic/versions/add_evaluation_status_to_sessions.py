"""add_evaluation_status_to_sessions

Revision ID: add_eval_status
Revises: change_passes_int
Create Date: 2026-01-24

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_eval_status'
down_revision = 'change_passes_int'
branch_labels = None
depends_on = None

# PostgreSQL enum: values match EvaluationStatus in session.py (lowercase)
EVALUATION_STATUS_ENUM = sa.Enum(
    'pending', 'in_progress', 'completed', 'failed',
    name='evaluationstatus',
)


def upgrade() -> None:
    EVALUATION_STATUS_ENUM.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'sessions',
        sa.Column('evaluation_status', EVALUATION_STATUS_ENUM, nullable=False, server_default='pending')
    )
    op.create_index('ix_sessions_evaluation_status', 'sessions', ['evaluation_status'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_sessions_evaluation_status', table_name='sessions')
    op.drop_column('sessions', 'evaluation_status')
    EVALUATION_STATUS_ENUM.drop(op.get_bind(), checkfirst=True)
