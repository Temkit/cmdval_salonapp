"""Pre-consultation domain entity."""

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional
from uuid import uuid4


@dataclass
class PreConsultationZone:
    """Zone eligibility for a pre-consultation."""

    zone_id: str
    is_eligible: bool = True
    observations: Optional[str] = None
    zone_nom: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class PreConsultation:
    """Pre-consultation for laser eligibility assessment (medical evaluation only)."""

    # Required demographics
    sexe: str  # 'M' or 'F'
    age: int

    # Marital status
    statut_marital: Optional[str] = None  # 'celibataire', 'marie', 'divorce', 'veuf'

    # Contraindications
    is_pregnant: bool = False
    is_breastfeeding: bool = False
    pregnancy_planning: bool = False

    # Previous laser history
    has_previous_laser: bool = False
    previous_laser_clarity_ii: bool = False
    previous_laser_sessions: Optional[int] = None
    previous_laser_brand: Optional[str] = None

    # Hair removal methods
    hair_removal_methods: list[str] = field(default_factory=list)

    # Medical history
    medical_history: dict = field(default_factory=dict)
    dermatological_conditions: list[str] = field(default_factory=list)
    has_current_treatments: bool = False
    current_treatments_details: Optional[str] = None

    # Peeling
    recent_peeling: bool = False
    recent_peeling_date: Optional[date] = None

    # Phototype
    phototype: Optional[str] = None

    # Notes
    notes: Optional[str] = None

    # Workflow status
    status: str = "draft"  # draft, pending_validation, validated, patient_created, rejected

    # Zone eligibility
    zones: list[PreConsultationZone] = field(default_factory=list)

    # Relationships
    patient_id: Optional[str] = None

    # Audit
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    validated_by: Optional[str] = None
    validated_by_name: Optional[str] = None
    validated_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    # Metadata
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

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

    @property
    def can_create_patient(self) -> bool:
        """Check if patient can be created from this pre-consultation."""
        return self.status == "validated" and self.patient_id is None

    def get_eligible_zones(self) -> list[PreConsultationZone]:
        """Get list of eligible zones."""
        return [z for z in self.zones if z.is_eligible]

    def get_ineligible_zones(self) -> list[PreConsultationZone]:
        """Get list of ineligible zones."""
        return [z for z in self.zones if not z.is_eligible]
