"""Pydantic schemas for pre-consultation."""

from datetime import date, datetime

from pydantic import Field, field_validator, model_validator

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
    "laser",
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
    "acne_juvenile",
    "migraine_photosensible",
    "mycose",
    "hyper_reactivite_cutanee",
    "tumeur_cutanee",
]

# Marital status options
MARITAL_STATUS_OPTIONS = ["celibataire", "marie"]


class PreConsultationZoneBase(AppBaseModel):
    """Base schema for pre-consultation zone."""

    zone_id: str
    is_eligible: bool = True
    observations: str | None = None


class PreConsultationZoneCreate(PreConsultationZoneBase):
    """Schema for creating a zone eligibility."""

    pass


class PreConsultationZoneUpdate(AppBaseModel):
    """Schema for updating a zone eligibility."""

    is_eligible: bool | None = None
    observations: str | None = None


class PreConsultationZoneResponse(PreConsultationZoneBase):
    """Response schema for zone eligibility."""

    id: str
    zone_nom: str | None = None
    created_at: datetime
    updated_at: datetime


class PreConsultationBase(AppBaseModel):
    """Base schema for pre-consultation (medical evaluation only - no personal info)."""

    # Demographics (required)
    sexe: str = Field(min_length=1, max_length=1, pattern=r"^[MF]$")
    age: int | None = Field(None, ge=0, le=120)
    date_naissance: date | None = None

    # Marital status
    statut_marital: str | None = None

    # Contraindications
    is_pregnant: bool = False
    is_breastfeeding: bool = False
    pregnancy_planning: bool = False

    # Previous laser history
    has_previous_laser: bool = False
    previous_laser_clarity_ii: bool = False
    previous_laser_sessions: int | None = Field(None, ge=0)
    previous_laser_brand: str | None = Field(None, max_length=100)

    # Hair removal methods
    hair_removal_methods: list[str] = Field(default_factory=list)
    last_hair_removal_date: date | None = None

    # Medical history
    medical_history: dict[str, bool] = Field(default_factory=dict)
    dermatological_conditions: list[str] = Field(default_factory=list)
    has_current_treatments: bool = False
    current_treatments_details: str | None = None

    # Skin conditions
    has_moles: bool = False
    moles_location: str | None = Field(None, max_length=255)
    has_birthmarks: bool = False
    birthmarks_location: str | None = Field(None, max_length=255)

    # Contraception and hormonal
    contraception_method: str | None = Field(None, max_length=50)
    hormonal_disease_2years: bool = False

    # Peeling
    recent_peeling: bool = False
    recent_peeling_date: date | None = None
    peeling_zone: str | None = Field(None, max_length=100)

    # Previous laser dates
    last_laser_date: date | None = None

    # Phototype
    phototype: str | None = Field(None, pattern=r"^(I|II|III|IV|V|VI)$")

    # Notes
    notes: str | None = None

    @field_validator("statut_marital")
    @classmethod
    def validate_statut_marital(cls, v: str | None) -> str | None:
        if v is not None and v not in MARITAL_STATUS_OPTIONS:
            raise ValueError(f"Invalid statut_marital. Must be one of: {MARITAL_STATUS_OPTIONS}")
        return v

    @model_validator(mode="after")
    def compute_age_from_date_naissance(self) -> "PreConsultationBase":
        """Compute age from date_naissance if age not provided."""
        if self.date_naissance and self.age is None:
            today = date.today()
            self.age = (
                today.year
                - self.date_naissance.year
                - ((today.month, today.day) < (self.date_naissance.month, self.date_naissance.day))
            )
        if self.age is None:
            self.age = 0
        return self

    @field_validator("hair_removal_methods")
    @classmethod
    def validate_hair_removal_methods(cls, v: list[str]) -> list[str]:
        for method in v:
            if method not in HAIR_REMOVAL_METHODS:
                raise ValueError(f"Invalid hair removal method: {method}")
        return v


class PreConsultationCreate(PreConsultationBase):
    """Schema for creating a pre-consultation."""

    # Patient ID is required - patient must be created first
    patient_id: str = Field(min_length=1)

    # Optional zones to create with the pre-consultation
    zones: list[PreConsultationZoneCreate] = Field(default_factory=list)


class PreConsultationUpdate(AppBaseModel):
    """Schema for updating a pre-consultation."""

    # All fields optional for partial update
    sexe: str | None = Field(None, min_length=1, max_length=1, pattern=r"^[MF]$")
    age: int | None = Field(None, ge=0, le=120)
    date_naissance: date | None = None

    statut_marital: str | None = None

    is_pregnant: bool | None = None
    is_breastfeeding: bool | None = None
    pregnancy_planning: bool | None = None

    has_previous_laser: bool | None = None
    previous_laser_clarity_ii: bool | None = None
    previous_laser_sessions: int | None = Field(None, ge=0)
    previous_laser_brand: str | None = Field(None, max_length=100)

    hair_removal_methods: list[str] | None = None
    last_hair_removal_date: date | None = None

    medical_history: dict[str, bool] | None = None
    dermatological_conditions: list[str] | None = None
    has_current_treatments: bool | None = None
    current_treatments_details: str | None = None

    has_moles: bool | None = None
    moles_location: str | None = Field(None, max_length=255)
    has_birthmarks: bool | None = None
    birthmarks_location: str | None = Field(None, max_length=255)

    contraception_method: str | None = Field(None, max_length=50)
    hormonal_disease_2years: bool | None = None

    recent_peeling: bool | None = None
    recent_peeling_date: date | None = None
    peeling_zone: str | None = Field(None, max_length=100)

    last_laser_date: date | None = None

    phototype: str | None = Field(None, pattern=r"^(I|II|III|IV|V|VI)$")

    notes: str | None = None


class PreConsultationResponse(PreConsultationBase):
    """Response schema for pre-consultation."""

    id: str
    status: str
    patient_id: str  # Required - patient always exists

    # Patient info for display
    patient_nom: str | None = None
    patient_prenom: str | None = None
    patient_code_carte: str | None = None
    patient_telephone: str | None = None

    # Zone eligibility
    zones: list[PreConsultationZoneResponse] = Field(default_factory=list)

    # Computed properties
    has_contraindications: bool = False

    # Audit
    created_by: str | None = None
    created_by_name: str | None = None
    validated_by: str | None = None
    validated_by_name: str | None = None
    validated_at: datetime | None = None
    rejection_reason: str | None = None

    # Timestamps
    created_at: datetime
    updated_at: datetime


class PreConsultationListResponse(AppBaseModel):
    """Response schema for pre-consultation list item."""

    id: str
    patient_id: str
    patient_nom: str | None = None
    patient_prenom: str | None = None
    patient_code_carte: str | None = None
    sexe: str
    age: int
    phototype: str | None = None
    status: str
    has_contraindications: bool = False
    zones_count: int = 0
    ineligible_zones_count: int = 0
    created_by_name: str | None = None
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
    date_naissance: date | None = None
    telephone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    adresse: str | None = Field(None, max_length=255)
    ville: str | None = Field(None, max_length=100)
    code_postal: str | None = Field(None, max_length=10)

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
