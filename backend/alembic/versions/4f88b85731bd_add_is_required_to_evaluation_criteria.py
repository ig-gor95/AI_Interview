"""add_is_required_to_evaluation_criteria

Revision ID: 4f88b85731bd
Revises: add_interview_id_sim_scenarios
Create Date: 2026-02-07 20:45:32.125955

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4f88b85731bd'
down_revision = 'add_interview_id_sim_scenarios'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_required column to interview_evaluation_criteria table
    op.add_column('interview_evaluation_criteria', sa.Column('is_required', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    # Remove is_required column from interview_evaluation_criteria table
    op.drop_column('interview_evaluation_criteria', 'is_required')

