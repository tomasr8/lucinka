"""Add is_admin

Revision ID: 400be3edb18f
Revises: 3db7067ff480
Create Date: 2025-10-19 12:54:35.308660+00:00

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "400be3edb18f"
down_revision = "3db7067ff480"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("users", "is_admin")
