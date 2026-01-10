"""Add phototype column and make patient fields optional.

Revision ID: 002
Revises: 001
Create Date: 2025-01-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add phototype column
    op.add_column(
        "patients",
        sa.Column("phototype", sa.String(10), nullable=True),
    )

    # Make date_naissance nullable
    op.alter_column(
        "patients",
        "date_naissance",
        existing_type=sa.Date(),
        nullable=True,
    )

    # Make sexe nullable
    op.alter_column(
        "patients",
        "sexe",
        existing_type=sa.String(10),
        nullable=True,
    )

    # Make telephone nullable
    op.alter_column(
        "patients",
        "telephone",
        existing_type=sa.String(20),
        nullable=True,
    )

    # Make created_by nullable
    op.alter_column(
        "patients",
        "created_by",
        existing_type=sa.String(36),
        nullable=True,
    )


def downgrade() -> None:
    # Make created_by required again
    op.alter_column(
        "patients",
        "created_by",
        existing_type=sa.String(36),
        nullable=False,
    )

    # Make telephone required again
    op.alter_column(
        "patients",
        "telephone",
        existing_type=sa.String(20),
        nullable=False,
    )

    # Make sexe required again
    op.alter_column(
        "patients",
        "sexe",
        existing_type=sa.String(10),
        nullable=False,
    )

    # Make date_naissance required again
    op.alter_column(
        "patients",
        "date_naissance",
        existing_type=sa.Date(),
        nullable=False,
    )

    # Drop phototype column
    op.drop_column("patients", "phototype")
