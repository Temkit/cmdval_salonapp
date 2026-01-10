"""User management endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.v1.dependencies import CurrentUser, get_user_service, require_permission
from src.application.services import UserService
from src.domain.exceptions import (
    DuplicateUsernameError,
    RoleNotFoundError,
    UserNotFoundError,
)
from src.schemas.base import MessageResponse
from src.schemas.user import UserCreate, UserListResponse, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Utilisateurs"])


@router.get("", response_model=UserListResponse)
async def list_users(
    _: Annotated[dict, Depends(require_permission("users.view"))],
    user_service: Annotated[UserService, Depends(get_user_service)],
):
    """List all users."""
    users = await user_service.get_all_users()
    return UserListResponse(
        users=[
            UserResponse(
                id=u.id,
                email=u.username,  # username stored as email
                nom=u.nom,
                prenom=u.prenom,
                role_id=u.role_id,
                role_nom=u.role_name,
                actif=u.is_active,
                created_at=u.created_at,
                updated_at=u.updated_at,
            )
            for u in users
        ]
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: UserCreate,
    _: Annotated[dict, Depends(require_permission("users.manage"))],
    user_service: Annotated[UserService, Depends(get_user_service)],
):
    """Create a new user."""
    try:
        user = await user_service.create_user(
            email=request.email,
            password=request.password,
            nom=request.nom,
            prenom=request.prenom,
            role_id=request.role_id,
        )
        return UserResponse(
            id=user.id,
            email=user.username,
            nom=user.nom,
            prenom=user.prenom,
            role_id=user.role_id,
            role_nom=user.role_name,
            actif=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    except DuplicateUsernameError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet email est déjà utilisé",
        )
    except RoleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    _: Annotated[dict, Depends(require_permission("users.view"))],
    user_service: Annotated[UserService, Depends(get_user_service)],
):
    """Get user by ID."""
    try:
        user = await user_service.get_user(user_id)
        return UserResponse(
            id=user.id,
            email=user.username,
            nom=user.nom,
            prenom=user.prenom,
            role_id=user.role_id,
            role_nom=user.role_name,
            actif=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    request: UserUpdate,
    _: Annotated[dict, Depends(require_permission("users.manage"))],
    user_service: Annotated[UserService, Depends(get_user_service)],
):
    """Update user."""
    try:
        user = await user_service.update_user(
            user_id=user_id,
            email=request.email,
            nom=request.nom,
            prenom=request.prenom,
            role_id=request.role_id,
            is_active=request.is_active,
            password=request.password,
        )
        return UserResponse(
            id=user.id,
            email=user.username,
            nom=user.nom,
            prenom=user.prenom,
            role_id=user.role_id,
            role_nom=user.role_name,
            actif=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except DuplicateUsernameError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet email est déjà utilisé",
        )
    except RoleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    current_user: CurrentUser,
    _: Annotated[dict, Depends(require_permission("users.manage"))],
    user_service: Annotated[UserService, Depends(get_user_service)],
):
    """Delete user."""
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de supprimer votre propre compte",
        )
    try:
        await user_service.delete_user(user_id)
        return MessageResponse(message="Utilisateur supprimé")
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
