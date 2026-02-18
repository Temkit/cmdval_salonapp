"""Add new permissions (schedule, queue, payments, documents) to system roles.

Revision ID: 020
Revises: 019
Create Date: 2025-02-17 20:00:00.000000

"""

import json
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "020"
down_revision: str | None = "019"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

NEW_PERMISSIONS = [
    "schedule.view",
    "schedule.manage",
    "queue.view",
    "queue.manage",
    "payments.view",
    "payments.create",
    "payments.edit",
    "documents.view",
    "documents.manage",
]

SECRETAIRE_NEW = [
    "schedule.view",
    "schedule.manage",
    "queue.view",
    "queue.manage",
    "payments.view",
    "payments.create",
    "documents.view",
    "documents.manage",
]

PRATICIEN_NEW = [
    "schedule.view",
    "queue.view",
    "queue.manage",
    "payments.view",
    "documents.view",
]


def upgrade() -> None:
    conn = op.get_bind()
    roles = conn.execute(sa.text("SELECT id, name, permissions FROM roles WHERE is_system = true"))
    for role_id, name, perms_raw in roles:
        perms = json.loads(perms_raw) if isinstance(perms_raw, str) else (perms_raw or [])

        if name == "Admin":
            # Admin gets all new permissions
            for p in NEW_PERMISSIONS:
                if p not in perms:
                    perms.append(p)
        elif name == "Secrétaire":
            for p in SECRETAIRE_NEW:
                if p not in perms:
                    perms.append(p)
        elif name == "Praticien":
            for p in PRATICIEN_NEW:
                if p not in perms:
                    perms.append(p)
        else:
            continue

        conn.execute(
            sa.text("UPDATE roles SET permissions = :perms WHERE id = :id"),
            {"perms": json.dumps(perms), "id": role_id},
        )


def downgrade() -> None:
    conn = op.get_bind()
    roles = conn.execute(sa.text("SELECT id, permissions FROM roles WHERE is_system = true"))
    for role_id, perms_raw in roles:
        perms = json.loads(perms_raw) if isinstance(perms_raw, str) else (perms_raw or [])
        perms = [p for p in perms if p not in NEW_PERMISSIONS]
        conn.execute(
            sa.text("UPDATE roles SET permissions = :perms WHERE id = :id"),
            {"perms": json.dumps(perms), "id": role_id},
        )
