"""Role schemas."""

from datetime import datetime

from pydantic import Field

from src.schemas.base import AppBaseModel


class RoleBase(AppBaseModel):
    """Base role schema."""

    nom: str = Field(min_length=2, max_length=50)
    permissions: list[str] = Field(default_factory=list)


class RoleCreate(RoleBase):
    """Role creation schema."""

    pass


class RoleUpdate(AppBaseModel):
    """Role update schema."""

    nom: str | None = Field(default=None, min_length=2, max_length=50)
    permissions: list[str] | None = None


class RoleResponse(RoleBase):
    """Role response schema."""

    id: str
    is_system: bool
    created_at: datetime
    updated_at: datetime


class RoleListResponse(AppBaseModel):
    """Role list response."""

    roles: list[RoleResponse]


class PermissionResponse(AppBaseModel):
    """Permission response."""

    code: str
    description: str


class PermissionListResponse(AppBaseModel):
    """Permission list response."""

    permissions: list[PermissionResponse]
