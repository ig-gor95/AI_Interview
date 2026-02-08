"""change passes column from boolean to integer

Revision ID: change_passes_int
Revises: add_criterion_results
Create Date: 2026-02-08

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'change_passes_int'
down_revision = 'add_criterion_results'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        'session_evaluation_criterion_results',
        'passes',
        existing_type=sa.Boolean(),
        type_=sa.Integer(),
        existing_nullable=False,
        postgresql_using='CASE WHEN passes = true THEN 1 ELSE -1 END',
    )


def downgrade() -> None:
    op.alter_column(
        'session_evaluation_criterion_results',
        'passes',
        existing_type=sa.Integer(),
        type_=sa.Boolean(),
        existing_nullable=False,
        postgresql_using='CASE WHEN passes = 1 THEN true ELSE false END',
    )
