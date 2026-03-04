"""Add duree_mois, zones_illimitees, seances_illimitees to packs table.

Revision ID: 022
Revises: 021
Create Date: 2026-03-04 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "022"
down_revision: str | None = "021"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("packs", sa.Column("duree_mois", sa.Integer(), nullable=True))
    op.add_column("packs", sa.Column("zones_illimitees", sa.Boolean(), nullable=False, server_default="0"))
    op.add_column("packs", sa.Column("seances_illimitees", sa.Boolean(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("packs", "seances_illimitees")
    op.drop_column("packs", "zones_illimitees")
    op.drop_column("packs", "duree_mois")
