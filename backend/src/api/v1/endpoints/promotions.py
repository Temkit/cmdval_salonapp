"""Promotion endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from src.api.v1.dependencies import CurrentUser, get_promotion_service, require_permission
from src.application.services.promotion_service import PromotionService
from src.schemas.promotion import (
    PromotionCreate,
    PromotionListResponse,
    PromotionResponse,
    PromotionUpdate,
    ZonePriceResponse,
)

router = APIRouter(prefix="/promotions", tags=["promotions"])


def _to_response(p) -> PromotionResponse:
    return PromotionResponse(
        id=p.id,
        nom=p.nom,
        type=p.type,
        valeur=p.valeur,
        zone_ids=p.zone_ids,
        date_debut=p.date_debut,
        date_fin=p.date_fin,
        is_active=p.is_active,
        is_currently_active=p.is_currently_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("", response_model=PromotionListResponse)
async def list_promotions(
    current_user: CurrentUser,
    promotion_service: Annotated[PromotionService, Depends(get_promotion_service)],
    include_inactive: bool = False,
):
    promos = await promotion_service.get_all_promotions(include_inactive)
    return PromotionListResponse(promotions=[_to_response(p) for p in promos])


@router.get("/active", response_model=PromotionListResponse)
async def list_active_promotions(
    current_user: CurrentUser,
    promotion_service: Annotated[PromotionService, Depends(get_promotion_service)],
):
    promos = await promotion_service.get_active_promotions()
    return PromotionListResponse(promotions=[_to_response(p) for p in promos])


@router.post("", response_model=PromotionResponse, status_code=201)
async def create_promotion(
    data: PromotionCreate,
    current_user: Annotated[dict, Depends(require_permission("config:manage"))],
    promotion_service: Annotated[PromotionService, Depends(get_promotion_service)],
):
    promo = await promotion_service.create_promotion(
        nom=data.nom,
        type=data.type,
        valeur=data.valeur,
        zone_ids=data.zone_ids,
        date_debut=data.date_debut,
        date_fin=data.date_fin,
    )
    return _to_response(promo)


@router.put("/{promotion_id}", response_model=PromotionResponse)
async def update_promotion(
    promotion_id: str,
    data: PromotionUpdate,
    current_user: Annotated[dict, Depends(require_permission("config:manage"))],
    promotion_service: Annotated[PromotionService, Depends(get_promotion_service)],
):
    promo = await promotion_service.update_promotion(
        promotion_id, **data.model_dump(exclude_unset=True)
    )
    return _to_response(promo)


@router.delete("/{promotion_id}")
async def delete_promotion(
    promotion_id: str,
    current_user: Annotated[dict, Depends(require_permission("config:manage"))],
    promotion_service: Annotated[PromotionService, Depends(get_promotion_service)],
):
    await promotion_service.delete_promotion(promotion_id)
    return {"message": "Promotion désactivée"}


@router.get("/zones/{zone_id}/price", response_model=ZonePriceResponse)
async def get_zone_price(
    zone_id: str,
    original_price: int,
    current_user: CurrentUser,
    promotion_service: Annotated[PromotionService, Depends(get_promotion_service)],
):
    return await promotion_service.get_zone_price(zone_id, original_price)
