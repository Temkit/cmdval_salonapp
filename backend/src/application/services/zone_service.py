"""Zone service."""

from src.domain.entities.zone import PatientZone, ZoneDefinition
from src.domain.exceptions import (
    DuplicateZoneError,
    PatientNotFoundError,
    ZoneNotFoundError,
)
from src.infrastructure.database.repositories import (
    PatientRepository,
    PatientZoneRepository,
    ZoneDefinitionRepository,
)


class ZoneDefinitionService:
    """Service for zone definition operations."""

    def __init__(self, zone_repository: ZoneDefinitionRepository):
        self.zone_repository = zone_repository

    async def create_zone(
        self,
        code: str,
        nom: str,
        description: str | None = None,
        ordre: int = 0,
    ) -> ZoneDefinition:
        """Create a new zone definition."""
        existing = await self.zone_repository.find_by_nom(nom)
        if existing:
            raise DuplicateZoneError(nom)

        zone = ZoneDefinition(
            code=code,
            nom=nom,
            description=description,
            ordre=ordre,
        )

        return await self.zone_repository.create(zone)

    async def get_zone(self, zone_id: str) -> ZoneDefinition:
        """Get zone by ID."""
        zone = await self.zone_repository.find_by_id(zone_id)
        if not zone:
            raise ZoneNotFoundError(zone_id)
        return zone

    async def get_all_zones(self, include_inactive: bool = False) -> list[ZoneDefinition]:
        """Get all zone definitions."""
        return await self.zone_repository.find_all(include_inactive)

    async def update_zone(
        self,
        zone_id: str,
        nom: str | None = None,
        description: str | None = None,
        ordre: int | None = None,
        is_active: bool | None = None,
    ) -> ZoneDefinition:
        """Update zone definition."""
        zone = await self.zone_repository.find_by_id(zone_id)
        if not zone:
            raise ZoneNotFoundError(zone_id)

        if nom and nom != zone.nom:
            existing = await self.zone_repository.find_by_nom(nom)
            if existing:
                raise DuplicateZoneError(nom)
            zone.nom = nom

        if description is not None:
            zone.description = description
        if ordre is not None:
            zone.ordre = ordre
        if is_active is not None:
            zone.is_active = is_active

        return await self.zone_repository.update(zone)

    async def delete_zone(self, zone_id: str) -> bool:
        """Delete zone definition."""
        zone = await self.zone_repository.find_by_id(zone_id)
        if not zone:
            raise ZoneNotFoundError(zone_id)
        return await self.zone_repository.delete(zone_id)


class PatientZoneService:
    """Service for patient zone operations."""

    def __init__(
        self,
        patient_zone_repository: PatientZoneRepository,
        zone_definition_repository: ZoneDefinitionRepository,
        patient_repository: PatientRepository,
    ):
        self.patient_zone_repository = patient_zone_repository
        self.zone_definition_repository = zone_definition_repository
        self.patient_repository = patient_repository

    async def add_zone_to_patient(
        self,
        patient_id: str,
        zone_definition_id: str,
        seances_prevues: int = 6,
        notes: str | None = None,
    ) -> PatientZone:
        """Add a zone to a patient."""
        # Verify patient exists
        patient = await self.patient_repository.find_by_id(patient_id)
        if not patient:
            raise PatientNotFoundError(patient_id)

        # Verify zone definition exists
        zone_def = await self.zone_definition_repository.find_by_id(zone_definition_id)
        if not zone_def:
            raise ZoneNotFoundError(zone_definition_id)

        # Check if patient already has this zone
        existing = await self.patient_zone_repository.find_by_patient_and_zone(
            patient_id, zone_definition_id
        )
        if existing:
            raise DuplicateZoneError(
                f"Le patient a déjà la zone '{zone_def.nom}'"
            )

        patient_zone = PatientZone(
            patient_id=patient_id,
            zone_id=zone_definition_id,
            zone_nom=zone_def.nom,
            seances_total=seances_prevues,
            notes=notes,
        )

        return await self.patient_zone_repository.create(patient_zone)

    async def get_patient_zone(self, zone_id: str) -> PatientZone:
        """Get patient zone by ID."""
        zone = await self.patient_zone_repository.find_by_id(zone_id)
        if not zone:
            raise ZoneNotFoundError(zone_id)
        return zone

    async def get_patient_zones(self, patient_id: str) -> list[PatientZone]:
        """Get all zones for a patient."""
        patient = await self.patient_repository.find_by_id(patient_id)
        if not patient:
            raise PatientNotFoundError(patient_id)
        return await self.patient_zone_repository.find_by_patient(patient_id)

    async def update_patient_zone(
        self,
        zone_id: str,
        seances_prevues: int | None = None,
        notes: str | None = None,
    ) -> PatientZone:
        """Update patient zone."""
        zone = await self.patient_zone_repository.find_by_id(zone_id)
        if not zone:
            raise ZoneNotFoundError(zone_id)

        if seances_prevues is not None:
            zone.seances_total = seances_prevues
        if notes is not None:
            zone.notes = notes

        return await self.patient_zone_repository.update(zone)

    async def delete_patient_zone(self, zone_id: str) -> bool:
        """Delete patient zone."""
        zone = await self.patient_zone_repository.find_by_id(zone_id)
        if not zone:
            raise ZoneNotFoundError(zone_id)
        return await self.patient_zone_repository.delete(zone_id)

    async def increment_sessions(self, zone_id: str) -> PatientZone:
        """Increment session count for a patient zone."""
        return await self.patient_zone_repository.increment_seances(zone_id)
