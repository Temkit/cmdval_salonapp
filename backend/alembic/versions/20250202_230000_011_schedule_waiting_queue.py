"""Create daily_schedules and waiting_queue tables.

Revision ID: 011
Revises: 010
Create Date: 2025-02-02 23:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "011"
down_revision: str | None = "010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "daily_schedules",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False, index=True),
        sa.Column("patient_nom", sa.String(100), nullable=False),
        sa.Column("patient_prenom", sa.String(100), nullable=False),
        sa.Column(
            "patient_id",
            sa.String(36),
            sa.ForeignKey("patients.id"),
            nullable=True,
        ),
        sa.Column("doctor_name", sa.String(100), nullable=False),
        sa.Column(
            "doctor_id",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("specialite", sa.String(100), nullable=True),
        sa.Column("duration_type", sa.String(50), nullable=True),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="expected"),
        sa.Column(
            "uploaded_by",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "waiting_queue",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "schedule_id",
            sa.String(36),
            sa.ForeignKey("daily_schedules.id"),
            nullable=True,
        ),
        sa.Column(
            "patient_id",
            sa.String(36),
            sa.ForeignKey("patients.id"),
            nullable=True,
        ),
        sa.Column("patient_name", sa.String(200), nullable=False),
        sa.Column(
            "doctor_id",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("doctor_name", sa.String(100), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="waiting"),
        sa.Column("called_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("waiting_queue")
    op.drop_table("daily_schedules")
