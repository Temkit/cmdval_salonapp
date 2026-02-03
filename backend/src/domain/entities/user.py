"""User domain entity."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import uuid4


@dataclass
class User:
    """User domain entity."""

    username: str
    password_hash: str
    nom: str
    prenom: str
    role_id: str
    role_name: str = ""
    permissions: list[str] = field(default_factory=list)
    is_active: bool = True
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    @property
    def full_name(self) -> str:
        """Return full name."""
        return f"{self.prenom} {self.nom}"

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission."""
        return permission in self.permissions

    def is_admin(self) -> bool:
        """Check if user is admin."""
        return self.role_name == "admin"
