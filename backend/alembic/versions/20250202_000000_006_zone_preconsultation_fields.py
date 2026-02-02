"""Add zone pricing/category fields and pre-consultation medical fields.

Revision ID: 006
Revises: 005
Create Date: 2025-02-02 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "006"
down_revision: str | None = "005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Zone definition enhancements
    op.add_column("zone_definitions", sa.Column("prix", sa.Integer(), nullable=True))
    op.add_column("zone_definitions", sa.Column("duree_minutes", sa.Integer(), nullable=True))
    op.add_column("zone_definitions", sa.Column("categorie", sa.String(20), nullable=True))
    op.add_column(
        "zone_definitions",
        sa.Column("is_homme", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    # Pre-consultation medical fields
    op.add_column(
        "pre_consultations",
        sa.Column("has_moles", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("pre_consultations", sa.Column("moles_location", sa.String(255), nullable=True))
    op.add_column(
        "pre_consultations",
        sa.Column("has_birthmarks", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "pre_consultations", sa.Column("birthmarks_location", sa.String(255), nullable=True)
    )
    op.add_column(
        "pre_consultations", sa.Column("contraception_method", sa.String(50), nullable=True)
    )
    op.add_column(
        "pre_consultations",
        sa.Column(
            "hormonal_disease_2years",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "pre_consultations", sa.Column("last_hair_removal_date", sa.Date(), nullable=True)
    )
    op.add_column("pre_consultations", sa.Column("last_laser_date", sa.Date(), nullable=True))
    op.add_column("pre_consultations", sa.Column("peeling_zone", sa.String(100), nullable=True))


def downgrade() -> None:
    # Remove pre-consultation fields
    op.drop_column("pre_consultations", "peeling_zone")
    op.drop_column("pre_consultations", "last_laser_date")
    op.drop_column("pre_consultations", "last_hair_removal_date")
    op.drop_column("pre_consultations", "hormonal_disease_2years")
    op.drop_column("pre_consultations", "contraception_method")
    op.drop_column("pre_consultations", "birthmarks_location")
    op.drop_column("pre_consultations", "has_birthmarks")
    op.drop_column("pre_consultations", "moles_location")
    op.drop_column("pre_consultations", "has_moles")

    # Remove zone definition fields
    op.drop_column("zone_definitions", "is_homme")
    op.drop_column("zone_definitions", "categorie")
    op.drop_column("zone_definitions", "duree_minutes")
    op.drop_column("zone_definitions", "prix")
