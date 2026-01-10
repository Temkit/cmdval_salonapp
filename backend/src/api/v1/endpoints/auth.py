"""Authentication endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.v1.dependencies import CurrentUser, get_auth_service
from src.application.services import AuthService
from src.domain.exceptions import AuthenticationError, InvalidCredentialsError
from src.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    PasswordChangeRequest,
    TokenResponse,
)
from src.schemas.base import MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    """Authenticate user and return JWT token."""
    try:
        token, _ = await auth_service.login(request.username, request.password)
        return TokenResponse(access_token=token)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user(current_user: CurrentUser):
    """Get current authenticated user info."""
    return CurrentUserResponse(**current_user)


@router.put("/password", response_model=MessageResponse)
async def change_password(
    request: PasswordChangeRequest,
    current_user: CurrentUser,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    """Change current user's password."""
    try:
        await auth_service.change_password(
            user_id=current_user["id"],
            current_password=request.current_password,
            new_password=request.new_password,
        )
        return MessageResponse(message="Mot de passe modifié avec succès")
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect",
        )
