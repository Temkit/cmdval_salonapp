"""Promotion schemas."""

from datetime import date, datetime

from pydantic import Field

from src.schemas.base import AppBaseModel


class PromotionBase(AppBaseModel):
    nom: str = Field(min_length=1, max_length=100)
    type: str = Field(pattern=r"^(pourcentage|montant)$")
    valeur: float = Field(ge=0)
    zone_ids: list[str] = Field(default_factory=list)
    date_debut: date | None = None
    date_fin: date | None = None


class PromotionCreate(PromotionBase):
    pass


class PromotionUpdate(AppBaseModel):
    nom: str | None = Field(default=None, min_length=1, max_length=100)
    type: str | None = Field(default=None, pattern=r"^(pourcentage|montant)$")
    valeur: float | None = Field(default=None, ge=0)
    zone_ids: list[str] | None = None
    date_debut: date | None = None
    date_fin: date | None = None
    is_active: bool | None = None


class PromotionResponse(PromotionBase):
    id: str
    is_active: bool
    is_currently_active: bool = False
    created_at: datetime
    updated_at: datetime


class PromotionListResponse(AppBaseModel):
    promotions: list[PromotionResponse]


class ZonePriceResponse(AppBaseModel):
    original_price: int
    final_price: int
    discount: int
    promotions: list[dict]
