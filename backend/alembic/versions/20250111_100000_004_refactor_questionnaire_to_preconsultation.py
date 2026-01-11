"""Refactor questionnaire to pre-consultation and remove temp_* fields.

This migration:
1. Removes temp_* fields from pre_consultations (patient info now entered at patient creation)
2. Changes question_responses to link to pre_consultation_id instead of patient_id

Revision ID: 004
Revises: 003
Create Date: 2025-01-11 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Remove temp_* columns from pre_consultations table
    # These fields are no longer needed - patient info is entered when creating patient
    op.drop_column("pre_consultations", "temp_nom")
    op.drop_column("pre_consultations", "temp_prenom")
    op.drop_column("pre_consultations", "temp_date_naissance")
    op.drop_column("pre_consultations", "temp_adresse")
    op.drop_column("pre_consultations", "temp_telephone")
    op.drop_column("pre_consultations", "temp_email")

    # 2. Update question_responses table to link to pre_consultation instead of patient
    # First, drop the old foreign key constraint and column
    op.drop_constraint("uq_patient_question_response", "question_responses", type_="unique")
    op.drop_constraint(
        "question_responses_patient_id_fkey", "question_responses", type_="foreignkey"
    )
    op.drop_column("question_responses", "patient_id")

    # Add new pre_consultation_id column
    op.add_column(
        "question_responses",
        sa.Column(
            "pre_consultation_id",
            sa.String(36),
            sa.ForeignKey("pre_consultations.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )

    # Add new unique constraint
    op.create_unique_constraint(
        "uq_preconsult_question",
        "question_responses",
        ["pre_consultation_id", "question_id"],
    )

    # Add index for efficient lookups
    op.create_index(
        "ix_question_responses_pre_consultation_id",
        "question_responses",
        ["pre_consultation_id"],
    )


def downgrade() -> None:
    # Remove new index and constraint
    op.drop_index("ix_question_responses_pre_consultation_id", "question_responses")
    op.drop_constraint("uq_preconsult_question", "question_responses", type_="unique")

    # Drop pre_consultation_id column and foreign key
    op.drop_constraint(
        "question_responses_pre_consultation_id_fkey",
        "question_responses",
        type_="foreignkey",
    )
    op.drop_column("question_responses", "pre_consultation_id")

    # Restore patient_id column
    op.add_column(
        "question_responses",
        sa.Column(
            "patient_id",
            sa.String(36),
            sa.ForeignKey("patients.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    op.create_unique_constraint(
        "uq_patient_question_response", "question_responses", ["patient_id", "question_id"]
    )

    # Restore temp_* columns in pre_consultations
    op.add_column(
        "pre_consultations",
        sa.Column("temp_nom", sa.String(100), nullable=True),
    )
    op.add_column(
        "pre_consultations",
        sa.Column("temp_prenom", sa.String(100), nullable=True),
    )
    op.add_column(
        "pre_consultations",
        sa.Column("temp_date_naissance", sa.Date, nullable=True),
    )
    op.add_column(
        "pre_consultations",
        sa.Column("temp_adresse", sa.String(255), nullable=True),
    )
    op.add_column(
        "pre_consultations",
        sa.Column("temp_telephone", sa.String(20), nullable=True),
    )
    op.add_column(
        "pre_consultations",
        sa.Column("temp_email", sa.String(255), nullable=True),
    )
