"""Pre-consultation service."""

from __future__ import annotations

from datetime import UTC, datetime

from src.domain.entities.pre_consultation import PreConsultation, PreConsultationZone
from src.domain.exceptions import NotFoundError, ValidationError
from src.infrastructure.database.repositories import (
    PatientRepository,
    PatientZoneRepository,
    PreConsultationRepository,
    ZoneDefinitionRepository,
)


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
        patient_id: str,
        sexe: str,
        age: int,
        date_naissance=None,
        created_by: str = "",
        statut_marital: str | None = None,
        is_pregnant: bool = False,
        is_breastfeeding: bool = False,
        pregnancy_planning: bool = False,
        has_previous_laser: bool = False,
        previous_laser_clarity_ii: bool = False,
        previous_laser_sessions: int | None = None,
        previous_laser_brand: str | None = None,
        hair_removal_methods: list[str] | None = None,
        last_hair_removal_date=None,
        medical_history: dict | None = None,
        dermatological_conditions: list[str] | None = None,
        has_current_treatments: bool = False,
        current_treatments_details: str | None = None,
        has_moles: bool = False,
        moles_location: str | None = None,
        has_birthmarks: bool = False,
        birthmarks_location: str | None = None,
        contraception_method: str | None = None,
        hormonal_disease_2years: bool = False,
        recent_peeling: bool = False,
        recent_peeling_date=None,
        peeling_zone: str | None = None,
        last_laser_date=None,
        phototype: str | None = None,
        notes: str | None = None,
        zones: list[dict] | None = None,
    ) -> PreConsultation:
        """Create a new pre-consultation for an existing patient."""
        # Verify patient exists
        patient = await self.patient_repo.find_by_id(patient_id)
        if not patient:
            raise NotFoundError(f"Patient {patient_id} not found")

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
            patient_id=patient_id,
            sexe=sexe,
            age=age,
            date_naissance=date_naissance,
            statut_marital=statut_marital,
            is_pregnant=is_pregnant,
            is_breastfeeding=is_breastfeeding,
            pregnancy_planning=pregnancy_planning,
            has_previous_laser=has_previous_laser,
            previous_laser_clarity_ii=previous_laser_clarity_ii,
            previous_laser_sessions=previous_laser_sessions,
            previous_laser_brand=previous_laser_brand,
            hair_removal_methods=hair_removal_methods or [],
            last_hair_removal_date=last_hair_removal_date,
            medical_history=medical_history or {},
            dermatological_conditions=dermatological_conditions or [],
            has_current_treatments=has_current_treatments,
            current_treatments_details=current_treatments_details,
            has_moles=has_moles,
            moles_location=moles_location,
            has_birthmarks=has_birthmarks,
            birthmarks_location=birthmarks_location,
            contraception_method=contraception_method,
            hormonal_disease_2years=hormonal_disease_2years,
            recent_peeling=recent_peeling,
            recent_peeling_date=recent_peeling_date,
            peeling_zone=peeling_zone,
            last_laser_date=last_laser_date,
            phototype=phototype,
            notes=notes,
            status="in_progress",
            zones=zone_entities,
            created_by=created_by,
        )

        return await self.pre_consultation_repo.create(pre_consultation)

    async def get_by_id(self, pre_consultation_id: str) -> PreConsultation:
        """Get pre-consultation by ID."""
        pre_consultation = await self.pre_consultation_repo.find_by_id(pre_consultation_id)
        if not pre_consultation:
            raise NotFoundError(f"Pre-consultation {pre_consultation_id} not found")
        return pre_consultation

    async def get_by_patient_id(self, patient_id: str) -> PreConsultation | None:
        """Get pre-consultation by patient ID."""
        return await self.pre_consultation_repo.find_by_patient_id(patient_id)

    async def list(
        self,
        page: int,
        size: int,
        status: str | None = None,
        search: str | None = None,
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

        # Only allow updates in in_progress status
        if pre_consultation.status != "in_progress":
            raise ValidationError("Can only update pre-consultations in in_progress status")

        # Update fields
        for key, value in kwargs.items():
            if value is not None and hasattr(pre_consultation, key):
                setattr(pre_consultation, key, value)

        return await self.pre_consultation_repo.update(pre_consultation)

    async def delete(self, pre_consultation_id: str) -> bool:
        """Delete pre-consultation."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        # Only allow deletion in in_progress or rejected status
        if pre_consultation.status not in ("in_progress", "rejected"):
            raise ValidationError("Can only delete pre-consultations in in_progress or rejected status")

        return await self.pre_consultation_repo.delete(pre_consultation_id)

    async def add_zone(
        self,
        pre_consultation_id: str,
        zone_id: str,
        is_eligible: bool = True,
        observations: str | None = None,
    ) -> PreConsultationZone:
        """Add zone eligibility to pre-consultation."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "in_progress":
            raise ValidationError("Can only modify zones in in_progress status")

        # Verify zone exists
        zone = await self.zone_repo.find_by_id(zone_id)
        if not zone:
            raise NotFoundError(f"Zone {zone_id} not found")

        zone_entity = PreConsultationZone(
            zone_id=zone_id,
            is_eligible=is_eligible,
            observations=observations,
        )

        return await self.pre_consultation_repo.add_zone(pre_consultation_id, zone_entity)

    async def update_zone(
        self,
        pre_consultation_id: str,
        zone_id: str,
        is_eligible: bool,
        observations: str | None = None,
    ) -> PreConsultationZone:
        """Update zone eligibility."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "in_progress":
            raise ValidationError("Can only modify zones in in_progress status")

        zone = await self.pre_consultation_repo.update_zone(
            pre_consultation_id, zone_id, is_eligible, observations
        )
        if not zone:
            raise NotFoundError(f"Zone {zone_id} not found in pre-consultation")
        return zone

    async def delete_zone(self, pre_consultation_id: str, zone_id: str) -> bool:
        """Delete zone eligibility."""
        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "in_progress":
            raise ValidationError("Can only modify zones in in_progress status")

        return await self.pre_consultation_repo.delete_zone(pre_consultation_id, zone_id)

    async def complete(self, pre_consultation_id: str, completed_by: str) -> PreConsultation:
        """Complete pre-consultation and activate patient."""
        from src.domain.entities.patient import PATIENT_STATUS_ACTIF

        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "in_progress":
            raise ValidationError("Can only complete pre-consultations in in_progress status")

        # Update pre-consultation status
        pre_consultation.status = "completed"
        pre_consultation.validated_by = completed_by
        pre_consultation.validated_at = datetime.now(UTC).replace(tzinfo=None)
        result = await self.pre_consultation_repo.update(pre_consultation)

        # Update patient status to active
        patient = await self.patient_repo.find_by_id(pre_consultation.patient_id)
        if patient:
            patient.status = PATIENT_STATUS_ACTIF
            await self.patient_repo.update(patient)

        return result

    async def reject(
        self, pre_consultation_id: str, reason: str, rejected_by: str
    ) -> PreConsultation:
        """Reject pre-consultation and mark patient as ineligible."""
        from src.domain.entities.patient import PATIENT_STATUS_INELIGIBLE

        pre_consultation = await self.get_by_id(pre_consultation_id)

        if pre_consultation.status != "in_progress":
            raise ValidationError("Can only reject pre-consultations in in_progress status")

        # Update pre-consultation status
        pre_consultation.status = "rejected"
        pre_consultation.rejection_reason = reason
        pre_consultation.validated_by = rejected_by
        pre_consultation.validated_at = datetime.now(UTC).replace(tzinfo=None)
        result = await self.pre_consultation_repo.update(pre_consultation)

        # Update patient status to ineligible
        patient = await self.patient_repo.find_by_id(pre_consultation.patient_id)
        if patient:
            patient.status = PATIENT_STATUS_INELIGIBLE
            await self.patient_repo.update(patient)

        return result

    async def count_by_status(self, status: str) -> int:
        """Count pre-consultations by status."""
        return await self.pre_consultation_repo.count_by_status(status)
