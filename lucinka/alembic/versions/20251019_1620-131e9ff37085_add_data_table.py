"""Add data table

Revision ID: 131e9ff37085
Revises: b06f639b2bc6
Create Date: 2025-10-19 16:20:06.598556+00:00

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "131e9ff37085"
down_revision = "b06f639b2bc6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add data table with weight and height
    op.create_table(
        "data",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_dt", sa.DateTime(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("height", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("weight IS NOT NULL OR height IS NOT NULL", name="weight_or_height_not_null"),
    )


def downgrade() -> None:
    op.drop_table("data")
