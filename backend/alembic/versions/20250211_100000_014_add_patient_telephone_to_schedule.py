"""Add patient_telephone column to daily_schedules table.

Revision ID: 014
Revises: 013
Create Date: 2025-02-11 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "014"
down_revision: str | None = "013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "daily_schedules",
        sa.Column("patient_telephone", sa.String(20), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("daily_schedules", "patient_telephone")
