"""Add visits  table

Revision ID: d5c23450bcc2
Revises: 131e9ff37085
Create Date: 2025-10-21 09:43:40.642122+00:00

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "d5c23450bcc2"
down_revision = "131e9ff37085"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add data table with weight and height
    op.create_table(
        "visits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_dt", sa.DateTime(), nullable=False),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("doctor", sa.Text(), nullable=False),
        sa.Column("location", sa.Text(), nullable=False),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("visits")
