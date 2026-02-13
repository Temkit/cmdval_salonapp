"""Paiement endpoints."""

from datetime import datetime
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select

from src.api.v1.dependencies import CurrentUser, get_db, get_paiement_service
from src.application.services.paiement_service import PaiementService
from src.infrastructure.database.models import PaymentMethodModel
from src.schemas.paiement import (
    PaiementCreate,
    PaiementListResponse,
    PaiementResponse,
    PaymentMethodCreate,
    PaymentMethodResponse,
    PaymentMethodUpdate,
    RevenueStatsResponse,
)

router = APIRouter(prefix="/paiements", tags=["paiements"])


def _to_response(p) -> PaiementResponse:
    return PaiementResponse(
        id=p.id,
        patient_id=p.patient_id,
        patient_nom=p.patient_nom,
        patient_prenom=p.patient_prenom,
        subscription_id=p.subscription_id,
        session_id=p.session_id,
        montant=p.montant,
        type=p.type,
        mode_paiement=p.mode_paiement,
        reference=p.reference,
        notes=p.notes,
        created_by=p.created_by,
        date_paiement=p.date_paiement,
        created_at=p.created_at,
    )


@router.post("", response_model=PaiementResponse, status_code=201)
async def create_paiement(
    data: PaiementCreate,
    current_user: CurrentUser,
    paiement_service: Annotated[PaiementService, Depends(get_paiement_service)],
):
    """Record a payment."""
    paiement = await paiement_service.create_paiement(
        patient_id=data.patient_id,
        montant=data.montant,
        type=data.type,
        created_by=current_user.get("id"),
        subscription_id=data.subscription_id,
        session_id=data.session_id,
        mode_paiement=data.mode_paiement,
        reference=data.reference,
        notes=data.notes,
    )
    return _to_response(paiement)


@router.get("", response_model=PaiementListResponse)
async def list_paiements(
    current_user: CurrentUser,
    paiement_service: Annotated[PaiementService, Depends(get_paiement_service)],
    patient_id: str | None = None,
    type: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    """List payments with filters."""
    paiements, total = await paiement_service.list_paiements(
        patient_id=patient_id,
        type=type,
        date_from=date_from,
        date_to=date_to,
        page=page,
        size=size,
    )
    return PaiementListResponse(
        paiements=[_to_response(p) for p in paiements],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0,
    )


@router.get("/patients/{patient_id}")
async def get_patient_paiements(
    patient_id: str,
    current_user: CurrentUser,
    paiement_service: Annotated[PaiementService, Depends(get_paiement_service)],
):
    """Get payment history for a patient."""
    paiements = await paiement_service.get_patient_paiements(patient_id)
    return {"paiements": [_to_response(p) for p in paiements]}


@router.get("/stats", response_model=RevenueStatsResponse)
async def get_revenue_stats(
    current_user: CurrentUser,
    paiement_service: Annotated[PaiementService, Depends(get_paiement_service)],
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    """Get revenue statistics."""
    return await paiement_service.get_revenue_stats(date_from, date_to)


# --- Payment Methods CRUD ---


@router.get("/methods", response_model=list[PaymentMethodResponse])
async def list_payment_methods(
    current_user: CurrentUser,
    session=Depends(get_db),
):
    """List all payment methods (active only by default)."""
    result = await session.execute(
        select(PaymentMethodModel).order_by(PaymentMethodModel.ordre, PaymentMethodModel.nom)
    )
    methods = result.scalars().all()
    return [
        PaymentMethodResponse(
            id=m.id, nom=m.nom, is_active=m.is_active, ordre=m.ordre,
            created_at=m.created_at, updated_at=m.updated_at,
        )
        for m in methods
    ]


@router.post("/methods", response_model=PaymentMethodResponse, status_code=201)
async def create_payment_method(
    data: PaymentMethodCreate,
    current_user: CurrentUser,
    session=Depends(get_db),
):
    """Create a payment method."""
    method = PaymentMethodModel(
        id=str(uuid4()),
        nom=data.nom,
        is_active=True,
        ordre=data.ordre or 0,
    )
    session.add(method)
    await session.commit()
    await session.refresh(method)
    return PaymentMethodResponse(
        id=method.id, nom=method.nom, is_active=method.is_active, ordre=method.ordre,
        created_at=method.created_at, updated_at=method.updated_at,
    )


@router.put("/methods/{method_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    method_id: str,
    data: PaymentMethodUpdate,
    current_user: CurrentUser,
    session=Depends(get_db),
):
    """Update a payment method."""
    result = await session.execute(
        select(PaymentMethodModel).where(PaymentMethodModel.id == method_id)
    )
    method = result.scalar_one_or_none()
    if not method:
        raise HTTPException(status_code=404, detail="Mode de paiement introuvable")

    if data.nom is not None:
        method.nom = data.nom
    if data.is_active is not None:
        method.is_active = data.is_active
    if data.ordre is not None:
        method.ordre = data.ordre

    await session.commit()
    await session.refresh(method)
    return PaymentMethodResponse(
        id=method.id, nom=method.nom, is_active=method.is_active, ordre=method.ordre,
        created_at=method.created_at, updated_at=method.updated_at,
    )


@router.delete("/methods/{method_id}", status_code=204)
async def delete_payment_method(
    method_id: str,
    current_user: CurrentUser,
    session=Depends(get_db),
):
    """Delete a payment method."""
    result = await session.execute(
        select(PaymentMethodModel).where(PaymentMethodModel.id == method_id)
    )
    method = result.scalar_one_or_none()
    if not method:
        raise HTTPException(status_code=404, detail="Mode de paiement introuvable")
    await session.delete(method)
    await session.commit()
