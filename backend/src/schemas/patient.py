"""Patient schemas."""

from datetime import date, datetime
from typing import Literal

from pydantic import EmailStr, Field

from src.schemas.base import AppBaseModel, PaginatedResponse

# Patient status values
PatientStatus = Literal["en_attente_evaluation", "actif", "ineligible"]


class PatientBase(AppBaseModel):
    """Base patient schema."""

    nom: str = Field(min_length=1, max_length=100)
    prenom: str = Field(min_length=1, max_length=100)
    date_naissance: date | None = None
    sexe: str | None = Field(default=None, pattern=r"^[MF]$")
    telephone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    adresse: str | None = None
    notes: str | None = None
    phototype: str | None = Field(default=None, pattern=r"^(I|II|III|IV|V|VI)$")


class PatientCreate(PatientBase):
    """Patient creation schema."""

    code_carte: str = Field(min_length=1, max_length=50)
    status: PatientStatus = "en_attente_evaluation"


class PatientUpdate(AppBaseModel):
    """Patient update schema."""

    nom: str | None = Field(default=None, min_length=1, max_length=100)
    prenom: str | None = Field(default=None, min_length=1, max_length=100)
    date_naissance: date | None = None
    sexe: str | None = Field(default=None, pattern=r"^[MF]$")
    telephone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    adresse: str | None = None
    notes: str | None = None
    phototype: str | None = Field(default=None, pattern=r"^(I|II|III|IV|V|VI)$")
    status: PatientStatus | None = None


class PatientResponse(PatientBase):
    """Patient response schema."""

    id: str
    code_carte: str
    status: PatientStatus
    age: int | None = None
    created_at: datetime
    updated_at: datetime


class PatientListResponse(PaginatedResponse):
    """Patient list response."""

    patients: list[PatientResponse]


class PatientDetailResponse(PatientResponse):
    """Patient detail response with zones."""

    zones: list["PatientZoneResponse"] = []


# Import here to avoid circular imports
from src.schemas.zone import PatientZoneResponse  # noqa: E402

PatientDetailResponse.model_rebuild()
