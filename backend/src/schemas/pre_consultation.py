"""Pydantic schemas for pre-consultation."""

from datetime import date, datetime
from typing import Any, Optional

from pydantic import Field, field_validator

from src.schemas.base import AppBaseModel


# Hair removal method options
HAIR_REMOVAL_METHODS = [
    "razor",
    "wax",
    "cream",
    "thread",
    "tweezers",
    "epilator",
    "trimmer",
]

# Medical history options
MEDICAL_HISTORY_CONDITIONS = [
    "epilepsy",
    "pcos",
    "hormonal_imbalance",
    "diabetes",
    "autoimmune",
    "keloids",
    "herpes",
]

# Marital status options
MARITAL_STATUS_OPTIONS = ["celibataire", "marie", "divorce", "veuf"]


class PreConsultationZoneBase(AppBaseModel):
    """Base schema for pre-consultation zone."""

    zone_id: str
    is_eligible: bool = True
    observations: Optional[str] = None


class PreConsultationZoneCreate(PreConsultationZoneBase):
    """Schema for creating a zone eligibility."""

    pass


class PreConsultationZoneUpdate(AppBaseModel):
    """Schema for updating a zone eligibility."""

    is_eligible: Optional[bool] = None
    observations: Optional[str] = None


class PreConsultationZoneResponse(PreConsultationZoneBase):
    """Response schema for zone eligibility."""

    id: str
    zone_nom: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PreConsultationBase(AppBaseModel):
    """Base schema for pre-consultation (medical evaluation only - no personal info)."""

    # Demographics (required)
    sexe: str = Field(min_length=1, max_length=1, pattern=r"^[MF]$")
    age: int = Field(ge=0, le=120)

    # Marital status
    statut_marital: Optional[str] = None

    # Contraindications
    is_pregnant: bool = False
    is_breastfeeding: bool = False
    pregnancy_planning: bool = False

    # Previous laser history
    has_previous_laser: bool = False
    previous_laser_clarity_ii: bool = False
    previous_laser_sessions: Optional[int] = Field(None, ge=0)
    previous_laser_brand: Optional[str] = Field(None, max_length=100)

    # Hair removal methods
    hair_removal_methods: list[str] = Field(default_factory=list)

    # Medical history
    medical_history: dict[str, bool] = Field(default_factory=dict)
    dermatological_conditions: list[str] = Field(default_factory=list)
    has_current_treatments: bool = False
    current_treatments_details: Optional[str] = None

    # Peeling
    recent_peeling: bool = False
    recent_peeling_date: Optional[date] = None

    # Phototype
    phototype: Optional[str] = Field(None, pattern=r"^(I|II|III|IV|V|VI)$")

    # Notes
    notes: Optional[str] = None

    @field_validator("statut_marital")
    @classmethod
    def validate_statut_marital(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in MARITAL_STATUS_OPTIONS:
            raise ValueError(f"Invalid statut_marital. Must be one of: {MARITAL_STATUS_OPTIONS}")
        return v

    @field_validator("hair_removal_methods")
    @classmethod
    def validate_hair_removal_methods(cls, v: list[str]) -> list[str]:
        for method in v:
            if method not in HAIR_REMOVAL_METHODS:
                raise ValueError(f"Invalid hair removal method: {method}")
        return v


class PreConsultationCreate(PreConsultationBase):
    """Schema for creating a pre-consultation."""

    # Optional zones to create with the pre-consultation
    zones: list[PreConsultationZoneCreate] = Field(default_factory=list)


class PreConsultationUpdate(AppBaseModel):
    """Schema for updating a pre-consultation."""

    # All fields optional for partial update
    sexe: Optional[str] = Field(None, min_length=1, max_length=1, pattern=r"^[MF]$")
    age: Optional[int] = Field(None, ge=0, le=120)

    statut_marital: Optional[str] = None

    is_pregnant: Optional[bool] = None
    is_breastfeeding: Optional[bool] = None
    pregnancy_planning: Optional[bool] = None

    has_previous_laser: Optional[bool] = None
    previous_laser_clarity_ii: Optional[bool] = None
    previous_laser_sessions: Optional[int] = Field(None, ge=0)
    previous_laser_brand: Optional[str] = Field(None, max_length=100)

    hair_removal_methods: Optional[list[str]] = None

    medical_history: Optional[dict[str, bool]] = None
    dermatological_conditions: Optional[list[str]] = None
    has_current_treatments: Optional[bool] = None
    current_treatments_details: Optional[str] = None

    recent_peeling: Optional[bool] = None
    recent_peeling_date: Optional[date] = None

    phototype: Optional[str] = Field(None, pattern=r"^(I|II|III|IV|V|VI)$")

    notes: Optional[str] = None


class PreConsultationResponse(PreConsultationBase):
    """Response schema for pre-consultation."""

    id: str
    status: str
    patient_id: Optional[str] = None

    # Zone eligibility
    zones: list[PreConsultationZoneResponse] = Field(default_factory=list)

    # Computed properties
    has_contraindications: bool = False

    # Audit
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    validated_by: Optional[str] = None
    validated_by_name: Optional[str] = None
    validated_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime


class PreConsultationListResponse(AppBaseModel):
    """Response schema for pre-consultation list item."""

    id: str
    sexe: str
    age: int
    phototype: Optional[str] = None
    status: str
    has_contraindications: bool = False
    zones_count: int = 0
    eligible_zones_count: int = 0
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PreConsultationSubmitRequest(AppBaseModel):
    """Request schema for submitting pre-consultation."""

    pass  # No additional data needed


class PreConsultationValidateRequest(AppBaseModel):
    """Request schema for validating pre-consultation."""

    pass  # No additional data needed


class PreConsultationRejectRequest(AppBaseModel):
    """Request schema for rejecting pre-consultation."""

    reason: str = Field(min_length=1, max_length=1000)


class PreConsultationCreatePatientRequest(AppBaseModel):
    """Request schema for creating patient from validated pre-consultation."""

    # Patient personal info (entered only at this step)
    nom: str = Field(min_length=1, max_length=100)
    prenom: str = Field(min_length=1, max_length=100)
    date_naissance: Optional[date] = None
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    adresse: Optional[str] = Field(None, max_length=255)
    ville: Optional[str] = Field(None, max_length=100)
    code_postal: Optional[str] = Field(None, max_length=10)

    # Zones to add (from eligible zones)
    zone_ids: list[str] = Field(default_factory=list)
    seances_per_zone: int = Field(default=6, ge=1, le=20)


class PreConsultationPaginatedResponse(AppBaseModel):
    """Paginated response for pre-consultations."""

    items: list[PreConsultationListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
