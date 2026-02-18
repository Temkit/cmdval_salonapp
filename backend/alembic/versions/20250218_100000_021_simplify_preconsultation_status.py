"""Simplify pre-consultation status: draft/pending_validation -> in_progress, validated/patient_created -> completed.

Revision ID: 021
Revises: 020
Create Date: 2025-02-18 10:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "021"
down_revision: str | None = "020"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Migrate old statuses to new simplified statuses
    op.execute(
        "UPDATE pre_consultations SET status = 'in_progress' "
        "WHERE status IN ('draft', 'pending_validation')"
    )
    op.execute(
        "UPDATE pre_consultations SET status = 'completed' "
        "WHERE status IN ('validated', 'patient_created')"
    )


def downgrade() -> None:
    # Best-effort rollback: in_progress -> draft, completed -> validated
    op.execute(
        "UPDATE pre_consultations SET status = 'draft' "
        "WHERE status = 'in_progress'"
    )
    op.execute(
        "UPDATE pre_consultations SET status = 'validated' "
        "WHERE status = 'completed'"
    )
