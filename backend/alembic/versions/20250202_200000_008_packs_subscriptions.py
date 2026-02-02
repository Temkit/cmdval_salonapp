"""Create packs and patient_subscriptions tables.

Revision ID: 008
Revises: 007
Create Date: 2025-02-02 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "008"
down_revision: str | None = "007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "packs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("nom", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("zone_ids", JSON(), nullable=False, server_default="[]"),
        sa.Column("prix", sa.Integer(), nullable=False),
        sa.Column("duree_jours", sa.Integer(), nullable=True),
        sa.Column("seances_per_zone", sa.Integer(), nullable=False, server_default="6"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "patient_subscriptions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "patient_id",
            sa.String(36),
            sa.ForeignKey("patients.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "pack_id",
            sa.String(36),
            sa.ForeignKey("packs.id"),
            nullable=True,
        ),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("date_debut", sa.Date(), nullable=True),
        sa.Column("date_fin", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("montant_paye", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_index("ix_patient_subscriptions_patient_id", "patient_subscriptions", ["patient_id"])


def downgrade() -> None:
    op.drop_index("ix_patient_subscriptions_patient_id", table_name="patient_subscriptions")
    op.drop_table("patient_subscriptions")
    op.drop_table("packs")
