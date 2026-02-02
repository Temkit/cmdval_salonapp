"""Create paiements table.

Revision ID: 009
Revises: 008
Create Date: 2025-02-02 21:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "009"
down_revision: str | None = "008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "paiements",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "patient_id",
            sa.String(36),
            sa.ForeignKey("patients.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "subscription_id",
            sa.String(36),
            sa.ForeignKey("patient_subscriptions.id"),
            nullable=True,
        ),
        sa.Column(
            "session_id",
            sa.String(36),
            sa.ForeignKey("sessions.id"),
            nullable=True,
        ),
        sa.Column("montant", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("mode_paiement", sa.String(20), nullable=True),
        sa.Column("reference", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_by",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("date_paiement", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_index("ix_paiements_patient_id", "paiements", ["patient_id"])
    op.create_index("ix_paiements_date_paiement", "paiements", ["date_paiement"])


def downgrade() -> None:
    op.drop_index("ix_paiements_date_paiement", table_name="paiements")
    op.drop_index("ix_paiements_patient_id", table_name="paiements")
    op.drop_table("paiements")
