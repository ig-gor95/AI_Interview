"""add is_reusable to interview_links

Revision ID: 20260220_005000
Revises: 20260218_225019
Create Date: 2026-02-20 00:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260220_005000'
down_revision = '20260218_225019'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_reusable column to interview_links table
    op.add_column(
        'interview_links',
        sa.Column('is_reusable', sa.Boolean(), nullable=False, server_default='false')
    )


def downgrade():
    # Remove is_reusable column
    op.drop_column('interview_links', 'is_reusable')
