"""JWT token creation and validation."""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from pydantic import BaseModel

from src.core.config import settings


class TokenPayload(BaseModel):
    """JWT token payload structure."""

    sub: str  # User ID
    username: str
    role: str
    permissions: list[str]
    exp: datetime
    iat: datetime


def create_access_token(
    user_id: str,
    username: str,
    role: str,
    permissions: list[str],
) -> str:
    """
    Create a JWT access token.

    Args:
        user_id: User's UUID
        username: User's username
        role: User's role name
        permissions: List of permission strings

    Returns:
        Encoded JWT token string
    """
    now = datetime.now(UTC)
    expire = now + timedelta(hours=settings.jwt_expire_hours)

    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "permissions": permissions,
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any] | None:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string

    Returns:
        Token payload dict or None if invalid/expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_expiration(token: str) -> datetime | None:
    """
    Get the expiration datetime from a token without validating.

    Args:
        token: JWT token string

    Returns:
        Expiration datetime or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"verify_exp": False},
        )
        exp = payload.get("exp")
        if exp:
            return datetime.fromtimestamp(exp, tz=UTC)
        return None
    except jwt.InvalidTokenError:
        return None


# Alias for backwards compatibility
decode_access_token = decode_token
