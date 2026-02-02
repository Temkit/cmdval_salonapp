"""Add Optiskin laser clinic features.

Revision ID: 003
Revises: 002
Create Date: 2025-01-11 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Pre-consultations table
    op.create_table(
        "pre_consultations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "patient_id",
            sa.String(36),
            sa.ForeignKey("patients.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Temp patient data (before patient creation)
        sa.Column("temp_nom", sa.String(100), nullable=True),
        sa.Column("temp_prenom", sa.String(100), nullable=True),
        sa.Column("temp_date_naissance", sa.Date, nullable=True),
        sa.Column("temp_adresse", sa.String(255), nullable=True),
        sa.Column("temp_telephone", sa.String(20), nullable=True),
        sa.Column("temp_email", sa.String(255), nullable=True),
        # Demographics
        sa.Column("sexe", sa.String(1), nullable=False),
        sa.Column("age", sa.Integer, nullable=False),
        sa.Column("statut_marital", sa.String(20), nullable=True),
        # Contraindications
        sa.Column("is_pregnant", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_breastfeeding", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("pregnancy_planning", sa.Boolean, nullable=False, server_default="false"),
        # Previous laser history
        sa.Column("has_previous_laser", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("previous_laser_clarity_ii", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("previous_laser_sessions", sa.Integer, nullable=True),
        sa.Column("previous_laser_brand", sa.String(100), nullable=True),
        # Hair removal methods (JSON array)
        sa.Column("hair_removal_methods", postgresql.JSONB, nullable=False, server_default="[]"),
        # Medical history
        sa.Column("medical_history", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column(
            "dermatological_conditions", postgresql.JSONB, nullable=False, server_default="[]"
        ),
        sa.Column("has_current_treatments", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("current_treatments_details", sa.Text, nullable=True),
        # Peeling
        sa.Column("recent_peeling", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("recent_peeling_date", sa.Date, nullable=True),
        # Phototype
        sa.Column("phototype", sa.String(10), nullable=True),
        # Notes
        sa.Column("notes", sa.Text, nullable=True),
        # Workflow status
        sa.Column("status", sa.String(30), nullable=False, server_default="draft"),
        # Audit
        sa.Column(
            "created_by",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column(
            "validated_by",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text, nullable=True),
        # Timestamps
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_pre_consultations_status", "pre_consultations", ["status"])
    op.create_index("ix_pre_consultations_patient_id", "pre_consultations", ["patient_id"])
    op.create_index("ix_pre_consultations_created_at", "pre_consultations", ["created_at"])

    # Pre-consultation zones table
    op.create_table(
        "pre_consultation_zones",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "pre_consultation_id",
            sa.String(36),
            sa.ForeignKey("pre_consultations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "zone_id",
            sa.String(36),
            sa.ForeignKey("zone_definitions.id"),
            nullable=False,
        ),
        sa.Column("is_eligible", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("observations", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("pre_consultation_id", "zone_id", name="uq_pre_consultation_zone"),
    )
    op.create_index(
        "ix_pre_consultation_zones_pre_consultation_id",
        "pre_consultation_zones",
        ["pre_consultation_id"],
    )

    # Session side effects table
    op.create_table(
        "session_side_effects",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "session_id",
            sa.String(36),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("severity", sa.String(20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_session_side_effects_session_id",
        "session_side_effects",
        ["session_id"],
    )

    # Side effect photos table
    op.create_table(
        "side_effect_photos",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "side_effect_id",
            sa.String(36),
            sa.ForeignKey("session_side_effects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("filepath", sa.String(500), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_side_effect_photos_side_effect_id",
        "side_effect_photos",
        ["side_effect_id"],
    )


def downgrade() -> None:
    op.drop_table("side_effect_photos")
    op.drop_table("session_side_effects")
    op.drop_table("pre_consultation_zones")
    op.drop_table("pre_consultations")
