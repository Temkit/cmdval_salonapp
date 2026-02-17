"""Add commune/wilaya to patients, change laser/peeling dates to text.

Revision ID: 018
Revises: 017
Create Date: 2025-02-17 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "018"
down_revision: str | None = "017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add commune and wilaya to patients table
    op.add_column("patients", sa.Column("commune", sa.String(100), nullable=True))
    op.add_column("patients", sa.Column("wilaya", sa.String(100), nullable=True))

    # Change last_laser_date from Date to String(100) in pre_consultations
    op.alter_column(
        "pre_consultations",
        "last_laser_date",
        existing_type=sa.Date(),
        type_=sa.String(100),
        existing_nullable=True,
        postgresql_using="last_laser_date::text",
    )

    # Change recent_peeling_date from Date to String(100) in pre_consultations
    op.alter_column(
        "pre_consultations",
        "recent_peeling_date",
        existing_type=sa.Date(),
        type_=sa.String(100),
        existing_nullable=True,
        postgresql_using="recent_peeling_date::text",
    )


def downgrade() -> None:
    op.alter_column(
        "pre_consultations",
        "recent_peeling_date",
        existing_type=sa.String(100),
        type_=sa.Date(),
        existing_nullable=True,
        postgresql_using="recent_peeling_date::date",
    )
    op.alter_column(
        "pre_consultations",
        "last_laser_date",
        existing_type=sa.String(100),
        type_=sa.Date(),
        existing_nullable=True,
        postgresql_using="last_laser_date::date",
    )
    op.drop_column("patients", "wilaya")
    op.drop_column("patients", "commune")
