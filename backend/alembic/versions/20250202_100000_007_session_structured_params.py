"""Add structured session parameters (spot_size, fluence, pulse_duration_ms, frequency_hz).

Revision ID: 007
Revises: 006
Create Date: 2025-02-02 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "007"
down_revision: str | None = "006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("sessions", sa.Column("spot_size", sa.Integer(), nullable=True))
    op.add_column("sessions", sa.Column("fluence", sa.Float(), nullable=True))
    op.add_column("sessions", sa.Column("pulse_duration_ms", sa.Integer(), nullable=True))
    op.add_column("sessions", sa.Column("frequency_hz", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("sessions", "frequency_hz")
    op.drop_column("sessions", "pulse_duration_ms")
    op.drop_column("sessions", "fluence")
    op.drop_column("sessions", "spot_size")
