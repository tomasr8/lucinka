"""Add photos table

Revision ID: d2df84de870e
Revises: d4d4d39a7288
Create Date: 2025-10-29 12:44:29.159649+00:00

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "d2df84de870e"
down_revision = "d4d4d39a7288"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "photos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("ext", sa.Text(), nullable=False),
        sa.Column("created_dt", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("photos")
