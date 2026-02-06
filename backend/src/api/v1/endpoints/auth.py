"""Authentication endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from src.api.v1.dependencies import CurrentUser, get_auth_service, get_box_service
from src.application.services import AuthService
from src.application.services.box_service import BoxService
from src.core.config import settings
from src.core.rate_limit import rate_limit_login
from src.domain.exceptions import AuthenticationError, InvalidCredentialsError
from src.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    PasswordChangeRequest,
    TokenResponse,
)
from src.schemas.base import MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentification"])

SESSION_COOKIE_NAME = "session_token"
SESSION_MAX_AGE = settings.jwt_expire_hours * 3600


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(rate_limit_login)])
async def login(
    request: LoginRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    """Authenticate user and return JWT token (also set as httpOnly cookie)."""
    try:
        token, _ = await auth_service.login(request.username, request.password)
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=token,
            httponly=True,
            secure=settings.secure_cookies,
            samesite="lax",
            max_age=SESSION_MAX_AGE,
            path="/",
        )
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


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """Clear the session cookie."""
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
    )
    return MessageResponse(message="Deconnexion reussie")


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user(
    current_user: CurrentUser,
    box_service: Annotated[BoxService, Depends(get_box_service)],
):
    """Get current authenticated user info."""
    box_info = await box_service.get_user_box(current_user["id"])
    return CurrentUserResponse(
        **current_user,
        box_id=box_info["box_id"] if box_info else None,
        box_nom=box_info["box_nom"] if box_info else None,
    )


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
