"""add food status table

Revision ID: add_food_status_table
Revises: add_solid_food_to_breastfeeding
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_food_status_table'
down_revision: Union[str, None] = 'add_solid_food_to_breastfeeding'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'food_status',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('food_name', sa.Text(), nullable=False),
        sa.Column('status', sa.Text(), nullable=False, server_default='undecided'),
        sa.Column('created_dt', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('food_status')
