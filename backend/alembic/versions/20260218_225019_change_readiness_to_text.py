"""change readiness to text

Revision ID: 20260218_225019
Revises:
Create Date: 2026-02-18 22:50:19.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260218_225019'
down_revision = 'change_passes_int'
branch_labels = None
depends_on = None


def upgrade():
    # Change readiness column from VARCHAR(500) to TEXT
    op.alter_column(
        'session_evaluations',
        'readiness',
        type_=sa.Text(),
        existing_type=sa.String(500),
        existing_nullable=True
    )


def downgrade():
    # Revert back to VARCHAR(500) - may truncate data if longer than 500 chars
    op.alter_column(
        'session_evaluations',
        'readiness',
        type_=sa.String(500),
        existing_type=sa.Text(),
        existing_nullable=True
    )
