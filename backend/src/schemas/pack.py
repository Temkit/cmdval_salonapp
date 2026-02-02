"""Pack and subscription schemas."""

from datetime import date, datetime

from pydantic import Field

from src.schemas.base import AppBaseModel


class PackBase(AppBaseModel):
    """Base pack schema."""

    nom: str = Field(min_length=1, max_length=100)
    prix: int = Field(ge=0)
    description: str | None = None
    zone_ids: list[str] = Field(default_factory=list)
    duree_jours: int | None = Field(default=None, ge=1)
    seances_per_zone: int = Field(default=6, ge=1, le=50)


class PackCreate(PackBase):
    """Pack creation schema."""

    pass


class PackUpdate(AppBaseModel):
    """Pack update schema."""

    nom: str | None = Field(default=None, min_length=1, max_length=100)
    prix: int | None = Field(default=None, ge=0)
    description: str | None = None
    zone_ids: list[str] | None = None
    duree_jours: int | None = Field(default=None, ge=1)
    seances_per_zone: int | None = Field(default=None, ge=1, le=50)
    is_active: bool | None = None


class PackResponse(PackBase):
    """Pack response schema."""

    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PackListResponse(AppBaseModel):
    """Pack list response."""

    packs: list[PackResponse]


class PatientSubscriptionCreate(AppBaseModel):
    """Patient subscription creation schema."""

    type: str = Field(pattern=r"^(gold|pack|seance)$")
    pack_id: str | None = None
    montant_paye: int = Field(default=0, ge=0)
    notes: str | None = None


class PatientSubscriptionResponse(AppBaseModel):
    """Patient subscription response schema."""

    id: str
    patient_id: str
    pack_id: str | None = None
    pack_nom: str | None = None
    type: str
    date_debut: date | None = None
    date_fin: date | None = None
    is_active: bool
    montant_paye: int
    notes: str | None = None
    days_remaining: int | None = None
    is_expired: bool = False
    created_at: datetime
    updated_at: datetime


class PatientSubscriptionListResponse(AppBaseModel):
    """Patient subscription list response."""

    subscriptions: list[PatientSubscriptionResponse]
