"""add solid food columns to breastfeeding

Revision ID: add_solid_food_to_breastfeeding
Revises: add_activities_table
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_solid_food_to_breastfeeding'
down_revision: Union[str, None] = 'add_activities_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('breastfeeding', sa.Column('is_solid', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('breastfeeding', sa.Column('solid_food', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('breastfeeding', 'solid_food')
    op.drop_column('breastfeeding', 'is_solid')
