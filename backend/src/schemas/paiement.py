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
    mode_paiement: str | None = Field(default=None, max_length=50)
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


# --- Payment Methods ---


class PaymentMethodCreate(AppBaseModel):
    """Payment method creation schema."""

    nom: str = Field(min_length=1, max_length=50)
    ordre: int | None = 0


class PaymentMethodUpdate(AppBaseModel):
    """Payment method update schema."""

    nom: str | None = Field(default=None, min_length=1, max_length=50)
    is_active: bool | None = None
    ordre: int | None = None


class PaymentMethodResponse(AppBaseModel):
    """Payment method response schema."""

    id: str
    nom: str
    is_active: bool
    ordre: int
    created_at: datetime
    updated_at: datetime
