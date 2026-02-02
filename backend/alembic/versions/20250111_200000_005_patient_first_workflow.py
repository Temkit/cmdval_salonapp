"""Patient-first workflow: add status to patients, require patient_id in pre_consultations.

Revision ID: 005
Revises: 004
Create Date: 2025-01-11 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: str | None = "004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add status field to patients table
    # Values: en_attente_evaluation, actif, ineligible
    op.add_column(
        "patients",
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default="actif",  # Existing patients are active
        ),
    )
    op.create_index("ix_patients_status", "patients", ["status"])

    # Delete any pre_consultations without patient_id (orphaned records)
    # This is safe because temp_ fields were removed, so orphaned records are useless
    op.execute("DELETE FROM pre_consultations WHERE patient_id IS NULL")

    # Now make patient_id NOT NULL
    op.alter_column(
        "pre_consultations",
        "patient_id",
        existing_type=sa.String(36),
        nullable=False,
    )


def downgrade() -> None:
    # Make patient_id nullable again
    op.alter_column(
        "pre_consultations",
        "patient_id",
        existing_type=sa.String(36),
        nullable=True,
    )

    # Remove status index and column from patients
    op.drop_index("ix_patients_status", "patients")
    op.drop_column("patients", "status")
