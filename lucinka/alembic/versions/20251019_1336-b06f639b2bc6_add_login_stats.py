"""Add login stats

Revision ID: b06f639b2bc6
Revises: 400be3edb18f
Create Date: 2025-10-19 13:36:30.850468+00:00

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "b06f639b2bc6"
down_revision = "400be3edb18f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add login_stats table
    op.create_table(
        "login_stats",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("login_dt", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("login_stats")
