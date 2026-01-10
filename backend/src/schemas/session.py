"""Session schemas."""

from datetime import datetime
from typing import Any

from pydantic import Field

from src.schemas.base import AppBaseModel, PaginatedResponse


class SessionPhotoResponse(AppBaseModel):
    """Session photo response schema."""

    id: str
    filename: str
    url: str
    created_at: datetime


class SessionBase(AppBaseModel):
    """Base session schema."""

    patient_zone_id: str
    type_laser: str = Field(min_length=1, max_length=50)
    parametres: dict[str, Any] = Field(default_factory=dict)
    notes: str | None = None
    duree_minutes: int | None = Field(default=None, ge=1, le=480)


class SessionCreate(SessionBase):
    """Session creation schema."""

    date_seance: datetime | None = None


class SessionResponse(AppBaseModel):
    """Session response schema."""

    id: str
    patient_id: str
    patient_zone_id: str
    zone_nom: str
    praticien_id: str
    praticien_nom: str
    date_seance: datetime
    type_laser: str
    parametres: dict[str, Any]
    notes: str | None
    duree_minutes: int | None
    photos: list[SessionPhotoResponse]
    created_at: datetime


class SessionListResponse(PaginatedResponse):
    """Session list response."""

    sessions: list[SessionResponse]


class SessionDetailResponse(SessionResponse):
    """Session detail response."""

    patient_nom: str
    patient_prenom: str
    patient_code_carte: str


class LaserTypeResponse(AppBaseModel):
    """Laser type response."""

    types: list[str]
