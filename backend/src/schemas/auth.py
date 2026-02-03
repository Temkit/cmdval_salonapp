"""Authentication schemas."""

from pydantic import Field

from src.schemas.base import AppBaseModel


class LoginRequest(AppBaseModel):
    """Login request."""

    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=4)


class TokenResponse(AppBaseModel):
    """Token response."""

    access_token: str
    token_type: str = "bearer"


class PasswordChangeRequest(AppBaseModel):
    """Password change request."""

    current_password: str
    new_password: str = Field(min_length=4)


class CurrentUserResponse(AppBaseModel):
    """Current user response."""

    id: str
    username: str
    nom: str
    prenom: str
    role_id: str
    role_nom: str
    permissions: list[str]
    box_id: str | None = None
    box_nom: str | None = None
