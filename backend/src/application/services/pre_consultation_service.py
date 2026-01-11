"""Pre-consultation service."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from src.domain.entities.pre_consultation import PreConsultation, PreConsultationZone
from src.domain.exceptions import NotFoundError, ValidationError
from src.infrastructure.database.repositories import (
    PatientRepository,
    PatientZoneRepository,
    PreConsultationRepository,
    ZoneDefinitionRepository,
)
from src.domain.entities.patient import Patient


class PreConsultationService:
    """Service for pre-consultation operations."""

    def __init__(
        self,
        pre_consultation_repo: PreConsultationRepository,
        patient_repo: PatientRepository,
        zone_repo: ZoneDefinitionRepository,
        patient_zone_repo: PatientZoneRepository,
    ):
        self.pre_consultation_repo = pre_consultation_repo
        self.patient_repo = patient_repo
        self.zone_repo = zone_repo
        self.patient_zone_repo = patient_zone_repo

    async def create(
        self,
        sexe: str,
        age: int,
        created_by: str,
        statut_marital: Optional[str] = None,
        is_pregnant: bool = False,
        is_breastfeeding: bool = False,
        pregnancy_planning: bool = False,
        has_previous_laser: bool = False,
        previous_laser_clarity_ii: bool = False,
        previous_laser_sessions: Optional[int] = None,
        previous_laser_brand: Optional[str] = None,
        hair_removal_methods: Optional[list[str]] = None,
        medical_history: Optional[dict] = None,
        dermatological_conditions: Optional[list[str]] = None,
        has_current_treatments: bool = False,
        current_treatments_details: Optional[str] = None,
        recent_peeling: bool = False,
        recent_peeling_date=None,
        phototype: Optional[str] = None,
        notes: Optional[str] = None,
        zones: Optional[list[dict]] = None,
    ) -> PreConsultation:
        """Create a new pre-consultation (medical evaluation only)."""
        # Create zone entities
        zone_entities = []
        if zones:
            for zone_data in zones:
                zone_entities.append(
                    PreConsultationZone(
                        zone_id=zone_data["zone_id"],
                        is_eligible=zone_data.get("is_eligible", True),
                        observations=zone_data.get("observations"),
                    )
                )

        pre_consultation = PreConsultation(
            sexe=sexe,
            age=age,
            statut_marital=statut_marital,
            is_pregnant=is_pregnant,
            is_breastfeeding=is_breastfeeding,
            pregnancy_planning=pregnancy_planning,
            has_previous_laser=has_previous_laser,
            previous_laser_clarity_ii=previous_laser_clarity_ii,
            previous_laser_sessions=previous_laser_sessions,
            previous_laser_brand=previous_laser_brand,
            hair_removal_methods=hair_removal_methods or [],
            medical_history=medical_history or {},
            dermatological_conditions=dermatological_conditions or [],
            has_current_treatments=has_current_treatments,
            current_treatments_details=current_treatments_details,
            recent_peeling=recent_peeling,
            recent_peeling_date=recent_peeling_date,
            phototype=phototype,
            notes=notes,
            status="draft",
            zones=zone_entities,
            created_by=created_by,
        )

        return await self.pre_consultation_repo.create(pre_consultation)

    async def get_by_id(self, pre_consultation_id: str) -> PreConsultation:
        """Get pre-consultation by ID."""
        pre_consultation = await self.pre_consultation_repo.find_by_id(
            pre_consultation_id
        )
        if not pre_consultation:
            raise NotFoundError(f"Pre-consultation {pre_consultation_id} not found")
        return pre_consultation

    async def get_by_patient_id(self, patient_id: str) -> Optional[PreConsultation]:
        """Get pre-consultation by patient ID."""
        return await self.pre_consultation_repo.find_by_patient_id(patient_id)

    async def list(
        self,
        page: int,
        size: int,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> tuple[list[PreConsultation], int]:
        """List pre-consultations with pagination and filters."""
        return await self.pre_consultation_repo.find_all(page, size, status, search)

    async def update(
        self,
        pre_consultation_id: str,
        **kwargs,
    ) -> PreConsultation:
        """Update pre-consultation."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        # Only allow updates in draft status
        if pre_consultation.status != "draft":
            raise ValidationError("Can only update pre-consultations in draft status")

        # Update fields
        for key, value in kwargs.items():
            if value is not None and hasattr(pre_consultation, key):
                setattr(pre_consultation, key, value)

        return await self.pre_consultation_repo.update(pre_consultation)

    async def delete(self, pre_consultation_id: str) -> bool:
        """Delete pre-consultation."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        # Only allow deletion in draft status
        if pre_consultation.status not in ("draft", "rejected"):
            raise ValidationError(
                "Can only delete pre-consultations in draft or rejected status"
            )

        return await self.pre_consultation_repo.delete(pre_consultation_id)

    async def add_zone(
        self,
        pre_consultation_id: str,
        zone_id: str,
        is_eligible: bool = True,
        observations: Optional[str] = None,
    ) -> PreConsultationZone:
        """Add zone eligibility to pre-consultation."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "draft":
            raise ValidationError("Can only modify zones in draft status")

        # Verify zone exists
        zone = await self.zone_repo.find_by_id(zone_id)
        if not zone:
            raise NotFoundError(f"Zone {zone_id} not found")

        zone_entity = PreConsultationZone(
            zone_id=zone_id,
            is_eligible=is_eligible,
            observations=observations,
        )

        return await self.pre_consultation_repo.add_zone(
            pre_consultation_id, zone_entity
        )

    async def update_zone(
        self,
        pre_consultation_id: str,
        zone_id: str,
        is_eligible: bool,
        observations: Optional[str] = None,
    ) -> PreConsultationZone:
        """Update zone eligibility."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "draft":
            raise ValidationError("Can only modify zones in draft status")

        zone = await self.pre_consultation_repo.update_zone(
            pre_consultation_id, zone_id, is_eligible, observations
        )
        if not zone:
            raise NotFoundError(f"Zone {zone_id} not found in pre-consultation")
        return zone

    async def delete_zone(self, pre_consultation_id: str, zone_id: str) -> bool:
        """Delete zone eligibility."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "draft":
            raise ValidationError("Can only modify zones in draft status")

        return await self.pre_consultation_repo.delete_zone(
            pre_consultation_id, zone_id
        )

    async def submit(self, pre_consultation_id: str) -> PreConsultation:
        """Submit pre-consultation for validation."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "draft":
            raise ValidationError("Can only submit pre-consultations in draft status")

        if len(pre_consultation.zones) == 0:
            raise ValidationError(
                "At least one zone must be evaluated before submission"
            )

        pre_consultation.status = "pending_validation"
        return await self.pre_consultation_repo.update(pre_consultation)

    async def validate(
        self, pre_consultation_id: str, validated_by: str
    ) -> PreConsultation:
        """Validate pre-consultation."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "pending_validation":
            raise ValidationError(
                "Can only validate pre-consultations pending validation"
            )

        pre_consultation.status = "validated"
        pre_consultation.validated_by = validated_by
        pre_consultation.validated_at = datetime.utcnow()
        return await self.pre_consultation_repo.update(pre_consultation)

    async def reject(
        self, pre_consultation_id: str, reason: str, rejected_by: str
    ) -> PreConsultation:
        """Reject pre-consultation."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "pending_validation":
            raise ValidationError(
                "Can only reject pre-consultations pending validation"
            )

        pre_consultation.status = "rejected"
        pre_consultation.rejection_reason = reason
        pre_consultation.validated_by = rejected_by
        pre_consultation.validated_at = datetime.utcnow()
        return await self.pre_consultation_repo.update(pre_consultation)

    async def create_patient(
        self,
        pre_consultation_id: str,
        nom: str,
        prenom: str,
        created_by: str,
        date_naissance=None,
        telephone: Optional[str] = None,
        email: Optional[str] = None,
        adresse: Optional[str] = None,
        ville: Optional[str] = None,
        code_postal: Optional[str] = None,
        zone_ids: Optional[list[str]] = None,
        seances_per_zone: int = 6,
    ) -> Patient:
        """Create patient from validated pre-consultation."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "validated":
            raise ValidationError(
                "Can only create patient from validated pre-consultation"
            )

        if pre_consultation.patient_id:
            raise ValidationError("Patient already created from this pre-consultation")

        # Generate unique card code
        code_carte = f"PC{str(uuid4())[:8].upper()}"

        # Create patient with info from request + medical data from pre-consultation
        patient = Patient(
            code_carte=code_carte,
            nom=nom,
            prenom=prenom,
            date_naissance=date_naissance,
            sexe=pre_consultation.sexe,  # Copy from pre-consultation
            telephone=telephone,
            email=email,
            adresse=adresse,
            phototype=pre_consultation.phototype,  # Copy from pre-consultation
            created_by=created_by,
        )

        created_patient = await self.patient_repo.create(patient)

        # Add eligible zones
        if zone_ids:
            for zone_id in zone_ids:
                # Verify zone was eligible in pre-consultation
                eligible_zone = next(
                    (z for z in pre_consultation.zones if z.zone_id == zone_id and z.is_eligible),
                    None,
                )
                if eligible_zone:
                    from src.domain.entities.zone import PatientZone
                    patient_zone = PatientZone(
                        patient_id=created_patient.id,
                        zone_id=zone_id,
                        seances_total=seances_per_zone,
                    )
                    await self.patient_zone_repo.create(patient_zone)

        # Update pre-consultation status
        pre_consultation.patient_id = created_patient.id
        pre_consultation.status = "patient_created"
        await self.pre_consultation_repo.update(pre_consultation)

        return created_patient

    async def count_by_status(self, status: str) -> int:
        """Count pre-consultations by status."""
        return await self.pre_consultation_repo.count_by_status(status)
