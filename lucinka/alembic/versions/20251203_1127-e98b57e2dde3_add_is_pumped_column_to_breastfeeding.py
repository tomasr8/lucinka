"""Add is_pumped column to breastfeeding

Revision ID: e98b57e2dde3
Revises: d2df84de870e
Create Date: 2025-12-03 11:27:57.538052+00:00

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = 'e98b57e2dde3'
down_revision = 'd2df84de870e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "breastfeeding",
        sa.Column("is_pumped", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("breastfeeding", "is_pumped")
