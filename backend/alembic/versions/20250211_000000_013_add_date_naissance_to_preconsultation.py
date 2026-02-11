"""Add date_naissance column to pre_consultations table.

Revision ID: 013
Revises: 012
Create Date: 2025-02-11 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "013"
down_revision: str | None = "012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "pre_consultations",
        sa.Column("date_naissance", sa.Date(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pre_consultations", "date_naissance")
