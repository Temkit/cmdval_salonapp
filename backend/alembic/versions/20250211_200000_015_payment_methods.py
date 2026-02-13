"""Create payment_methods table.

Revision ID: 015
Revises: 014
Create Date: 2025-02-11 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "015"
down_revision: str | None = "014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Default payment methods to seed
DEFAULT_METHODS = [
    ("especes", "Especes", 0),
    ("carte", "Carte", 1),
    ("virement", "Virement", 2),
]


def upgrade() -> None:
    op.create_table(
        "payment_methods",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("nom", sa.String(50), unique=True, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("ordre", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Seed default payment methods
    import uuid

    for method_id, nom, ordre in DEFAULT_METHODS:
        op.execute(
            sa.text(
                "INSERT INTO payment_methods (id, nom, is_active, ordre) VALUES (:id, :nom, true, :ordre)"
            ).bindparams(id=str(uuid.uuid4()), nom=nom, ordre=ordre)
        )


def downgrade() -> None:
    op.drop_table("payment_methods")
