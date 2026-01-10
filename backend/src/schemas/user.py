"""User schemas."""

from datetime import datetime

from pydantic import Field

from src.schemas.base import AppBaseModel


class UserBase(AppBaseModel):
    """Base user schema."""

    username: str = Field(min_length=3, max_length=50)
    nom: str = Field(min_length=1, max_length=100)
    prenom: str = Field(min_length=1, max_length=100)
    role_id: str


class UserCreate(UserBase):
    """User creation schema."""

    password: str = Field(min_length=4)


class UserUpdate(AppBaseModel):
    """User update schema."""

    username: str | None = Field(default=None, min_length=3, max_length=50)
    nom: str | None = Field(default=None, min_length=1, max_length=100)
    prenom: str | None = Field(default=None, min_length=1, max_length=100)
    role_id: str | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=4)


class UserResponse(AppBaseModel):
    """User response schema."""

    id: str
    username: str
    nom: str
    prenom: str
    role_id: str
    role_nom: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserListResponse(AppBaseModel):
    """User list response."""

    users: list[UserResponse]
