"""Pack and subscription endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from src.api.v1.dependencies import (
    CurrentUser,
    get_pack_service,
    get_subscription_service,
    require_permission,
)
from src.application.services.pack_service import PackService, SubscriptionService
from src.schemas.pack import (
    PackCreate,
    PackListResponse,
    PackResponse,
    PackUpdate,
    PatientSubscriptionCreate,
    PatientSubscriptionListResponse,
    PatientSubscriptionResponse,
)

router = APIRouter(prefix="/packs", tags=["packs"])


@router.get("", response_model=PackListResponse)
async def list_packs(
    current_user: CurrentUser,
    pack_service: Annotated[PackService, Depends(get_pack_service)],
    include_inactive: bool = False,
):
    """List all packs."""
    packs = await pack_service.get_all_packs(include_inactive)
    return PackListResponse(
        packs=[
            PackResponse(
                id=p.id,
                nom=p.nom,
                prix=p.prix,
                description=p.description,
                zone_ids=p.zone_ids,
                duree_jours=p.duree_jours,
                seances_per_zone=p.seances_per_zone,
                is_active=p.is_active,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in packs
        ]
    )


@router.post("", response_model=PackResponse, status_code=201)
async def create_pack(
    data: PackCreate,
    current_user: Annotated[dict, Depends(require_permission("config.manage"))],
    pack_service: Annotated[PackService, Depends(get_pack_service)],
):
    """Create a new pack (admin only)."""
    pack = await pack_service.create_pack(
        nom=data.nom,
        prix=data.prix,
        description=data.description,
        zone_ids=data.zone_ids,
        duree_jours=data.duree_jours,
        seances_per_zone=data.seances_per_zone,
    )
    return PackResponse(
        id=pack.id,
        nom=pack.nom,
        prix=pack.prix,
        description=pack.description,
        zone_ids=pack.zone_ids,
        duree_jours=pack.duree_jours,
        seances_per_zone=pack.seances_per_zone,
        is_active=pack.is_active,
        created_at=pack.created_at,
        updated_at=pack.updated_at,
    )


@router.put("/{pack_id}", response_model=PackResponse)
async def update_pack(
    pack_id: str,
    data: PackUpdate,
    current_user: Annotated[dict, Depends(require_permission("config.manage"))],
    pack_service: Annotated[PackService, Depends(get_pack_service)],
):
    """Update a pack (admin only)."""
    pack = await pack_service.update_pack(pack_id, **data.model_dump(exclude_unset=True))
    return PackResponse(
        id=pack.id,
        nom=pack.nom,
        prix=pack.prix,
        description=pack.description,
        zone_ids=pack.zone_ids,
        duree_jours=pack.duree_jours,
        seances_per_zone=pack.seances_per_zone,
        is_active=pack.is_active,
        created_at=pack.created_at,
        updated_at=pack.updated_at,
    )


@router.delete("/{pack_id}")
async def delete_pack(
    pack_id: str,
    current_user: Annotated[dict, Depends(require_permission("config.manage"))],
    pack_service: Annotated[PackService, Depends(get_pack_service)],
):
    """Deactivate a pack (admin only)."""
    await pack_service.delete_pack(pack_id)
    return {"message": "Pack désactivé"}


@router.post(
    "/patients/{patient_id}/subscriptions",
    response_model=PatientSubscriptionResponse,
    status_code=201,
)
async def create_subscription(
    patient_id: str,
    data: PatientSubscriptionCreate,
    current_user: CurrentUser,
    subscription_service: Annotated[SubscriptionService, Depends(get_subscription_service)],
):
    """Assign a subscription to a patient."""
    sub = await subscription_service.create_subscription(
        patient_id=patient_id,
        type=data.type,
        pack_id=data.pack_id,
        montant_paye=data.montant_paye,
        notes=data.notes,
    )
    return PatientSubscriptionResponse(
        id=sub.id,
        patient_id=sub.patient_id,
        pack_id=sub.pack_id,
        pack_nom=sub.pack_nom,
        pack_prix=sub.pack_prix,
        type=sub.type,
        date_debut=sub.date_debut,
        date_fin=sub.date_fin,
        is_active=sub.is_active,
        montant_paye=sub.montant_paye,
        notes=sub.notes,
        days_remaining=sub.days_remaining,
        is_expired=sub.is_expired,
        created_at=sub.created_at,
        updated_at=sub.updated_at,
    )


@router.get(
    "/patients/{patient_id}/subscriptions",
    response_model=PatientSubscriptionListResponse,
)
async def list_patient_subscriptions(
    patient_id: str,
    current_user: CurrentUser,
    subscription_service: Annotated[SubscriptionService, Depends(get_subscription_service)],
):
    """List subscriptions for a patient."""
    subs = await subscription_service.get_patient_subscriptions(patient_id)
    return PatientSubscriptionListResponse(
        subscriptions=[
            PatientSubscriptionResponse(
                id=s.id,
                patient_id=s.patient_id,
                pack_id=s.pack_id,
                pack_nom=s.pack_nom,
                pack_prix=s.pack_prix,
                type=s.type,
                date_debut=s.date_debut,
                date_fin=s.date_fin,
                is_active=s.is_active,
                montant_paye=s.montant_paye,
                notes=s.notes,
                days_remaining=s.days_remaining,
                is_expired=s.is_expired,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s in subs
        ]
    )
