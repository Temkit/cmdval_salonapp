"""Role and Permission domain entities."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import uuid4


class Permission(str, Enum):
    """Available system permissions."""

    # Patients
    PATIENTS_VIEW = "patients.view"
    PATIENTS_CREATE = "patients.create"
    PATIENTS_EDIT = "patients.edit"
    PATIENTS_DELETE = "patients.delete"
    PATIENTS_QUESTIONNAIRE_VIEW = "patients.questionnaire.view"
    PATIENTS_QUESTIONNAIRE_EDIT = "patients.questionnaire.edit"

    # Zones
    ZONES_VIEW = "zones.view"
    ZONES_MANAGE = "zones.manage"

    # Sessions
    SESSIONS_VIEW = "sessions.view"
    SESSIONS_CREATE = "sessions.create"

    # Users
    USERS_VIEW = "users.view"
    USERS_MANAGE = "users.manage"

    # Roles
    ROLES_VIEW = "roles.view"
    ROLES_MANAGE = "roles.manage"

    # Configuration
    CONFIG_QUESTIONNAIRE = "config.questionnaire"
    CONFIG_ZONES = "config.zones"

    # Dashboard
    DASHBOARD_VIEW = "dashboard.view"
    DASHBOARD_FULL = "dashboard.full"


# Default permissions for each role
DEFAULT_ADMIN_PERMISSIONS = [p.value for p in Permission]

DEFAULT_SECRETAIRE_PERMISSIONS = [
    Permission.PATIENTS_VIEW.value,
    Permission.PATIENTS_CREATE.value,
    Permission.PATIENTS_EDIT.value,
    Permission.PATIENTS_QUESTIONNAIRE_VIEW.value,
    Permission.PATIENTS_QUESTIONNAIRE_EDIT.value,
    Permission.ZONES_VIEW.value,
    Permission.SESSIONS_VIEW.value,
    Permission.DASHBOARD_VIEW.value,
]

DEFAULT_PRATICIEN_PERMISSIONS = [
    Permission.PATIENTS_VIEW.value,
    Permission.PATIENTS_QUESTIONNAIRE_VIEW.value,
    Permission.ZONES_VIEW.value,
    Permission.SESSIONS_VIEW.value,
    Permission.SESSIONS_CREATE.value,
    Permission.DASHBOARD_VIEW.value,
]

# Dictionary of default role permissions for seeding
DEFAULT_ROLE_PERMISSIONS = {
    "Admin": [p for p in Permission],
    "Secrétaire": [
        Permission.PATIENTS_VIEW,
        Permission.PATIENTS_CREATE,
        Permission.PATIENTS_EDIT,
        Permission.PATIENTS_QUESTIONNAIRE_VIEW,
        Permission.PATIENTS_QUESTIONNAIRE_EDIT,
        Permission.ZONES_VIEW,
        Permission.SESSIONS_VIEW,
        Permission.DASHBOARD_VIEW,
    ],
    "Praticien": [
        Permission.PATIENTS_VIEW,
        Permission.PATIENTS_QUESTIONNAIRE_VIEW,
        Permission.ZONES_VIEW,
        Permission.SESSIONS_VIEW,
        Permission.SESSIONS_CREATE,
        Permission.DASHBOARD_VIEW,
    ],
}


@dataclass
class Role:
    """Role domain entity."""

    name: str
    permissions: list[str]
    is_system: bool = False
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def has_permission(self, permission: str | Permission) -> bool:
        """Check if role has a specific permission."""
        perm_value = permission.value if isinstance(permission, Permission) else permission
        return perm_value in self.permissions

    def add_permission(self, permission: str | Permission) -> None:
        """Add a permission to the role."""
        perm_value = permission.value if isinstance(permission, Permission) else permission
        if perm_value not in self.permissions:
            self.permissions.append(perm_value)

    def remove_permission(self, permission: str | Permission) -> None:
        """Remove a permission from the role."""
        perm_value = permission.value if isinstance(permission, Permission) else permission
        if perm_value in self.permissions:
            self.permissions.remove(perm_value)
