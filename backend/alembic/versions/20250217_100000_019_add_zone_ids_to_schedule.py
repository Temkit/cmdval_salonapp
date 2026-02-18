"""Add zone_ids column to daily_schedules table.

Revision ID: 019
Revises: 018
Create Date: 2025-02-17 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "019"
down_revision: str | None = "018"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("daily_schedules", sa.Column("zone_ids", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("daily_schedules", "zone_ids")
