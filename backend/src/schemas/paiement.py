"""Paiement schemas."""

from datetime import datetime

from pydantic import Field

from src.schemas.base import AppBaseModel, PaginatedResponse


class PaiementCreate(AppBaseModel):
    """Paiement creation schema."""

    patient_id: str
    montant: int = Field(ge=0)
    type: str = Field(pattern=r"^(encaissement|prise_en_charge|hors_carte)$")
    subscription_id: str | None = None
    session_id: str | None = None
    mode_paiement: str | None = Field(default=None, pattern=r"^(especes|carte|virement)$")
    reference: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class PaiementResponse(AppBaseModel):
    """Paiement response schema."""

    id: str
    patient_id: str
    patient_nom: str | None = None
    patient_prenom: str | None = None
    subscription_id: str | None = None
    session_id: str | None = None
    montant: int
    type: str
    mode_paiement: str | None = None
    reference: str | None = None
    notes: str | None = None
    created_by: str | None = None
    date_paiement: datetime
    created_at: datetime


class PaiementListResponse(PaginatedResponse):
    """Paiement list response."""

    paiements: list[PaiementResponse]


class RevenueStatsResponse(AppBaseModel):
    """Revenue statistics response."""

    total_revenue: int
    total_payments: int
    by_type: list[dict]
