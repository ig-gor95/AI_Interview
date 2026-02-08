"""add_session_evaluation_criterion_results

Revision ID: add_criterion_results
Revises: 4f88b85731bd
Create Date: 2026-02-07

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_criterion_results'
down_revision = '4f88b85731bd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'session_evaluation_criterion_results',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('evaluation_id', sa.UUID(), nullable=False, index=True),
        sa.Column('criterion_id', sa.UUID(), nullable=False, index=True),
        sa.Column('passes', sa.Boolean(), nullable=False),
        sa.Column('fact', sa.Text(), nullable=True),
        sa.Column('justification', sa.Text(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['evaluation_id'], ['session_evaluations.id']),
        sa.ForeignKeyConstraint(['criterion_id'], ['interview_evaluation_criteria.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_unique_constraint(
        'uq_session_evaluation_criterion_results_eval_criterion',
        'session_evaluation_criterion_results',
        ['evaluation_id', 'criterion_id']
    )


def downgrade() -> None:
    op.drop_constraint(
        'uq_session_evaluation_criterion_results_eval_criterion',
        'session_evaluation_criterion_results',
        type_='unique'
    )
    op.drop_table('session_evaluation_criterion_results')
