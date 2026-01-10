"""Role management endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.v1.dependencies import get_role_service, require_permission
from src.application.services import RoleService
from src.domain.entities.role import Permission
from src.domain.exceptions import RoleInUseError, RoleNotFoundError, SystemRoleError
from src.schemas.base import MessageResponse
from src.schemas.role import (
    PermissionListResponse,
    PermissionResponse,
    RoleCreate,
    RoleListResponse,
    RoleResponse,
    RoleUpdate,
)

router = APIRouter(prefix="/roles", tags=["Rôles"])


@router.get("", response_model=RoleListResponse)
async def list_roles(
    _: Annotated[dict, Depends(require_permission("roles.view"))],
    role_service: Annotated[RoleService, Depends(get_role_service)],
):
    """List all roles."""
    roles = await role_service.get_all_roles()
    return RoleListResponse(
        roles=[
            RoleResponse(
                id=r.id,
                nom=r.name,
                permissions=r.permissions,
                is_system=r.is_system,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in roles
        ]
    )


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    request: RoleCreate,
    _: Annotated[dict, Depends(require_permission("roles.manage"))],
    role_service: Annotated[RoleService, Depends(get_role_service)],
):
    """Create a new role."""
    try:
        role = await role_service.create_role(
            nom=request.nom,
            permissions=request.permissions,
        )
        return RoleResponse(
            id=role.id,
            nom=role.name,
            permissions=role.permissions,
            is_system=role.is_system,
            created_at=role.created_at,
            updated_at=role.updated_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.get("/permissions", response_model=PermissionListResponse)
async def list_permissions(
    _: Annotated[dict, Depends(require_permission("roles.view"))],
):
    """List all available permissions."""
    permissions = [
        PermissionResponse(code=p.value, description=_get_permission_description(p))
        for p in Permission
    ]
    return PermissionListResponse(permissions=permissions)


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: str,
    _: Annotated[dict, Depends(require_permission("roles.view"))],
    role_service: Annotated[RoleService, Depends(get_role_service)],
):
    """Get role by ID."""
    try:
        role = await role_service.get_role(role_id)
        return RoleResponse(
            id=role.id,
            nom=role.name,
            permissions=role.permissions,
            is_system=role.is_system,
            created_at=role.created_at,
            updated_at=role.updated_at,
        )
    except RoleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    request: RoleUpdate,
    _: Annotated[dict, Depends(require_permission("roles.manage"))],
    role_service: Annotated[RoleService, Depends(get_role_service)],
):
    """Update role."""
    try:
        role = await role_service.update_role(
            role_id=role_id,
            nom=request.nom,
            permissions=request.permissions,
        )
        return RoleResponse(
            id=role.id,
            nom=role.name,
            permissions=role.permissions,
            is_system=role.is_system,
            created_at=role.created_at,
            updated_at=role.updated_at,
        )
    except RoleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except SystemRoleError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.delete("/{role_id}", response_model=MessageResponse)
async def delete_role(
    role_id: str,
    _: Annotated[dict, Depends(require_permission("roles.manage"))],
    role_service: Annotated[RoleService, Depends(get_role_service)],
):
    """Delete role."""
    try:
        await role_service.delete_role(role_id)
        return MessageResponse(message="Rôle supprimé")
    except RoleNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except SystemRoleError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except RoleInUseError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


def _get_permission_description(permission: Permission) -> str:
    """Get human-readable description for a permission."""
    descriptions = {
        Permission.PATIENTS_VIEW: "Voir les patients",
        Permission.PATIENTS_CREATE: "Créer des patients",
        Permission.PATIENTS_EDIT: "Modifier les patients",
        Permission.PATIENTS_DELETE: "Supprimer les patients",
        Permission.PATIENTS_QUESTIONNAIRE_VIEW: "Voir le questionnaire patient",
        Permission.PATIENTS_QUESTIONNAIRE_EDIT: "Modifier le questionnaire patient",
        Permission.SESSIONS_VIEW: "Voir les séances",
        Permission.SESSIONS_CREATE: "Créer des séances",
        Permission.ZONES_VIEW: "Voir les zones",
        Permission.ZONES_MANAGE: "Gérer les zones",
        Permission.USERS_VIEW: "Voir les utilisateurs",
        Permission.USERS_MANAGE: "Gérer les utilisateurs",
        Permission.ROLES_VIEW: "Voir les rôles",
        Permission.ROLES_MANAGE: "Gérer les rôles",
        Permission.CONFIG_QUESTIONNAIRE: "Configurer le questionnaire",
        Permission.CONFIG_ZONES: "Configurer les zones",
        Permission.DASHBOARD_VIEW: "Voir le tableau de bord",
        Permission.DASHBOARD_FULL: "Tableau de bord complet",
    }
    return descriptions.get(permission, permission.value)
