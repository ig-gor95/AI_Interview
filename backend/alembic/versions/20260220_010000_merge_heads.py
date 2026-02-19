"""merge heads

Revision ID: 20260220_010000
Revises: 20260220_005000, 20260219_235018
Create Date: 2026-02-20 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260220_010000'
down_revision = ('20260220_005000', '20260219_235018')
branch_labels = None
depends_on = None


def upgrade():
    # This is a merge migration - no changes needed
    # Both branches added the same is_reusable column
    pass


def downgrade():
    # This is a merge migration - no changes needed
    pass
