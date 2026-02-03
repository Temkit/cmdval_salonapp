"""Create boxes, box_assignments tables and add box columns to waiting_queue.

Revision ID: 012
Revises: 011
Create Date: 2025-02-03 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "012"
down_revision: str | None = "011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "boxes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("nom", sa.String(50), nullable=False),
        sa.Column("numero", sa.Integer(), unique=True, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "box_assignments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "box_id",
            sa.String(36),
            sa.ForeignKey("boxes.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("assigned_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.add_column(
        "waiting_queue",
        sa.Column(
            "box_id",
            sa.String(36),
            sa.ForeignKey("boxes.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "waiting_queue",
        sa.Column("box_nom", sa.String(50), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("waiting_queue", "box_nom")
    op.drop_column("waiting_queue", "box_id")
    op.drop_table("box_assignments")
    op.drop_table("boxes")
