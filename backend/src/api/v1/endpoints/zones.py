"""Zone management endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.v1.dependencies import get_zone_definition_service, require_permission
from src.application.services import ZoneDefinitionService
from src.domain.exceptions import DuplicateZoneError, ZoneNotFoundError
from src.schemas.base import MessageResponse
from src.schemas.zone import (
    ZoneDefinitionCreate,
    ZoneDefinitionListResponse,
    ZoneDefinitionResponse,
    ZoneDefinitionUpdate,
)

router = APIRouter(prefix="/zones", tags=["Zones"])


@router.get("", response_model=ZoneDefinitionListResponse)
async def list_zones(
    _: Annotated[dict, Depends(require_permission("zones.view"))],
    zone_service: Annotated[ZoneDefinitionService, Depends(get_zone_definition_service)],
    include_inactive: bool = Query(False, description="Inclure les zones inactives"),
):
    """List all zone definitions."""
    zones = await zone_service.get_all_zones(include_inactive=include_inactive)
    return ZoneDefinitionListResponse(
        zones=[
            ZoneDefinitionResponse(
                id=z.id,
                code=z.code,
                nom=z.nom,
                description=z.description,
                ordre=z.ordre,
                prix=z.prix,
                duree_minutes=z.duree_minutes,
                categorie=z.categorie,
                is_homme=z.is_homme,
                is_active=z.is_active,
                created_at=z.created_at,
            )
            for z in zones
        ]
    )


@router.post("", response_model=ZoneDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_zone(
    request: ZoneDefinitionCreate,
    _: Annotated[dict, Depends(require_permission("config.questionnaire"))],
    zone_service: Annotated[ZoneDefinitionService, Depends(get_zone_definition_service)],
):
    """Create a new zone definition."""
    try:
        zone = await zone_service.create_zone(
            code=request.code,
            nom=request.nom,
            description=request.description,
            ordre=request.ordre,
            prix=request.prix,
            duree_minutes=request.duree_minutes,
            categorie=request.categorie,
            is_homme=request.is_homme,
        )
        return ZoneDefinitionResponse(
            id=zone.id,
            code=zone.code,
            nom=zone.nom,
            description=zone.description,
            ordre=zone.ordre,
            prix=zone.prix,
            duree_minutes=zone.duree_minutes,
            categorie=zone.categorie,
            is_homme=zone.is_homme,
            is_active=zone.is_active,
            created_at=zone.created_at,
        )
    except DuplicateZoneError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.get("/{zone_id}", response_model=ZoneDefinitionResponse)
async def get_zone(
    zone_id: str,
    _: Annotated[dict, Depends(require_permission("zones.view"))],
    zone_service: Annotated[ZoneDefinitionService, Depends(get_zone_definition_service)],
):
    """Get zone definition by ID."""
    try:
        zone = await zone_service.get_zone(zone_id)
        return ZoneDefinitionResponse(
            id=zone.id,
            code=zone.code,
            nom=zone.nom,
            description=zone.description,
            ordre=zone.ordre,
            prix=zone.prix,
            duree_minutes=zone.duree_minutes,
            categorie=zone.categorie,
            is_homme=zone.is_homme,
            is_active=zone.is_active,
            created_at=zone.created_at,
        )
    except ZoneNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{zone_id}", response_model=ZoneDefinitionResponse)
async def update_zone(
    zone_id: str,
    request: ZoneDefinitionUpdate,
    _: Annotated[dict, Depends(require_permission("config.questionnaire"))],
    zone_service: Annotated[ZoneDefinitionService, Depends(get_zone_definition_service)],
):
    """Update zone definition."""
    try:
        zone = await zone_service.update_zone(
            zone_id=zone_id,
            nom=request.nom,
            description=request.description,
            ordre=request.ordre,
            prix=request.prix,
            duree_minutes=request.duree_minutes,
            categorie=request.categorie,
            is_homme=request.is_homme,
            is_active=request.is_active,
        )
        return ZoneDefinitionResponse(
            id=zone.id,
            code=zone.code,
            nom=zone.nom,
            description=zone.description,
            ordre=zone.ordre,
            prix=zone.prix,
            duree_minutes=zone.duree_minutes,
            categorie=zone.categorie,
            is_homme=zone.is_homme,
            is_active=zone.is_active,
            created_at=zone.created_at,
        )
    except ZoneNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except DuplicateZoneError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.delete("/{zone_id}", response_model=MessageResponse)
async def delete_zone(
    zone_id: str,
    _: Annotated[dict, Depends(require_permission("config.questionnaire"))],
    zone_service: Annotated[ZoneDefinitionService, Depends(get_zone_definition_service)],
):
    """Delete zone definition."""
    try:
        await zone_service.delete_zone(zone_id)
        return MessageResponse(message="Zone supprimée")
    except ZoneNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
