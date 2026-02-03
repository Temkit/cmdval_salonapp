"""Pre-consultation domain entity."""

from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from uuid import uuid4


@dataclass
class PreConsultationZone:
    """Zone eligibility for a pre-consultation."""

    zone_id: str
    is_eligible: bool = True
    observations: str | None = None
    zone_nom: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class PreConsultation:
    """Pre-consultation for laser eligibility assessment (medical evaluation only)."""

    # Required demographics
    sexe: str  # 'M' or 'F'
    age: int

    # Marital status
    statut_marital: str | None = None  # 'celibataire', 'marie', 'divorce', 'veuf'

    # Contraindications
    is_pregnant: bool = False
    is_breastfeeding: bool = False
    pregnancy_planning: bool = False

    # Previous laser history
    has_previous_laser: bool = False
    previous_laser_clarity_ii: bool = False
    previous_laser_sessions: int | None = None
    previous_laser_brand: str | None = None

    # Hair removal methods
    hair_removal_methods: list[str] = field(default_factory=list)
    last_hair_removal_date: date | None = None

    # Medical history
    medical_history: dict = field(default_factory=dict)
    dermatological_conditions: list[str] = field(default_factory=list)
    has_current_treatments: bool = False
    current_treatments_details: str | None = None

    # Skin conditions
    has_moles: bool = False
    moles_location: str | None = None
    has_birthmarks: bool = False
    birthmarks_location: str | None = None

    # Contraception and hormonal
    contraception_method: str | None = None
    hormonal_disease_2years: bool = False

    # Peeling
    recent_peeling: bool = False
    recent_peeling_date: date | None = None
    peeling_zone: str | None = None

    # Previous laser dates
    last_laser_date: date | None = None

    # Phototype
    phototype: str | None = None

    # Notes
    notes: str | None = None

    # Workflow status
    status: str = "draft"  # draft, pending_validation, validated, rejected

    # Zone eligibility
    zones: list[PreConsultationZone] = field(default_factory=list)

    # Patient relationship (required - patient is created first)
    patient_id: str = ""

    # Patient info for display (populated from relationship)
    patient_nom: str | None = None
    patient_prenom: str | None = None
    patient_code_carte: str | None = None
    patient_telephone: str | None = None

    # Audit
    created_by: str | None = None
    created_by_name: str | None = None
    validated_by: str | None = None
    validated_by_name: str | None = None
    validated_at: datetime | None = None
    rejection_reason: str | None = None

    # Metadata
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    @property
    def has_contraindications(self) -> bool:
        """Check if patient has any contraindications."""
        return self.is_pregnant or self.is_breastfeeding or self.pregnancy_planning

    @property
    def is_female(self) -> bool:
        """Check if patient is female."""
        return self.sexe == "F"

    @property
    def can_submit(self) -> bool:
        """Check if pre-consultation can be submitted for validation."""
        return self.status == "draft" and len(self.zones) > 0

    @property
    def can_validate(self) -> bool:
        """Check if pre-consultation can be validated."""
        return self.status == "pending_validation"

    def get_eligible_zones(self) -> list[PreConsultationZone]:
        """Get list of eligible zones."""
        return [z for z in self.zones if z.is_eligible]

    def get_ineligible_zones(self) -> list[PreConsultationZone]:
        """Get list of ineligible zones."""
        return [z for z in self.zones if not z.is_eligible]
