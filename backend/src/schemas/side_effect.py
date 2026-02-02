"""Pydantic schemas for side effects."""

from datetime import datetime

from pydantic import Field

from src.schemas.base import AppBaseModel

SEVERITY_OPTIONS = ["mild", "moderate", "severe"]


class SideEffectPhotoResponse(AppBaseModel):
    """Response schema for side effect photo."""

    id: str
    filename: str
    filepath: str
    created_at: datetime


class SideEffectBase(AppBaseModel):
    """Base schema for side effect."""

    description: str = Field(min_length=1, max_length=2000)
    severity: str | None = Field(None, pattern=r"^(mild|moderate|severe)$")


class SideEffectCreate(SideEffectBase):
    """Schema for creating a side effect."""

    pass


class SideEffectResponse(SideEffectBase):
    """Response schema for side effect."""

    id: str
    session_id: str
    photos: list[SideEffectPhotoResponse] = Field(default_factory=list)

    # Additional context
    zone_id: str | None = None
    zone_nom: str | None = None
    patient_id: str | None = None

    created_at: datetime


class SideEffectListResponse(AppBaseModel):
    """Response schema for side effect in list."""

    id: str
    session_id: str
    description: str
    severity: str | None = None
    zone_nom: str | None = None
    photos_count: int = 0
    created_at: datetime
