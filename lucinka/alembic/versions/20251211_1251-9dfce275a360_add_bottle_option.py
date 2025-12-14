"""Add bottle  option

Revision ID: 9dfce275a360
Revises: e98b57e2dde3
Create Date: 2025-12-11 12:51:46.555776+00:00

"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = '9dfce275a360'
down_revision = 'e98b57e2dde3'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        "breastfeeding",
        sa.Column("is_breast", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade():
    op.drop_column("breastfeeding", "is_breast")
