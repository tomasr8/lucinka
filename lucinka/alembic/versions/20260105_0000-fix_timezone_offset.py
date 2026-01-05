"""Fix timezone offset in breastfeeding timestamps

Revision ID: fix_timezone_offset
Revises: 36c06aca81af
Create Date: 2026-01-05 00:00:00.000000+00:00

This migration subtracts 1 hour from all existing start_dt and end_dt timestamps
in the breastfeeding table to correct for the timezone offset that was previously
applied in the application code.
"""

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "fix_timezone_offset"
down_revision = "36c06aca81af"
branch_labels = None
depends_on = None


def upgrade():
    # Subtract 1 hour (3600 seconds) from all existing breastfeeding timestamps
    # This corrects for the timezone offset that was previously applied in the app
    connection = op.get_bind()

    # SQLite uses datetime() function with modifiers
    connection.execute(
        sa.text("""
            UPDATE breastfeeding
            SET start_dt = datetime(start_dt, '-1 hour'),
                end_dt = datetime(end_dt, '-1 hour')
        """)
    )


def downgrade():
    # Add back 1 hour to revert the change
    connection = op.get_bind()

    connection.execute(
        sa.text("""
            UPDATE breastfeeding
            SET start_dt = datetime(start_dt, '+1 hour'),
                end_dt = datetime(end_dt, '+1 hour')
        """)
    )
