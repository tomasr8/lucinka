"""Add bottle ml

Revision ID: 36c06aca81af
Revises: 9dfce275a360
Create Date: 2025-12-11 13:15:22.193199+00:00

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = '36c06aca81af'
down_revision = '9dfce275a360'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        "breastfeeding",
        sa.Column("ml_amount", sa.Integer(), nullable=False, server_default="0"),
    )

def downgrade():
    op.drop_column("breastfeeding", "ml_amount")