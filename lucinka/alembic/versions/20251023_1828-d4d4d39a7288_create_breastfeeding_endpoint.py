"""Create breastfeeding endpoint

Revision ID: d4d4d39a7288
Revises: d5c23450bcc2
Create Date: 2025-10-23 18:28:56.405187+00:00

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "d4d4d39a7288"
down_revision = "d5c23450bcc2"
branch_labels = None
depends_on = None


def upgrade():
    # Create breastfeeding table
    op.create_table(
        "breastfeeding",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_dt", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("start_dt", sa.DateTime, nullable=False),
        sa.Column("end_dt", sa.DateTime, nullable=False),
        sa.Column("left_duration", sa.Integer, nullable=True),
        sa.Column("right_duration", sa.Integer, nullable=True),
    )
    # sa.Column('side', sa.String(length=10), nullable=False))


def downgrade():
    # Drop breastfeeding table
    op.drop_table("breastfeeding")
