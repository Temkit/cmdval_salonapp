"""Zone repository implementation."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.domain.entities.zone import PatientZone, ZoneDefinition
from src.infrastructure.database.models import PatientZoneModel, ZoneDefinitionModel


class ZoneDefinitionRepository:
    """Repository for zone definition operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, zone: ZoneDefinition) -> ZoneDefinition:
        """Create a new zone definition."""
        db_zone = ZoneDefinitionModel(
            id=zone.id,
            code=zone.code,
            nom=zone.nom,
            description=zone.description,
            ordre=zone.ordre,
            prix=zone.prix,
            duree_minutes=zone.duree_minutes,
            categorie=zone.categorie,
            is_homme=zone.is_homme,
            is_active=zone.is_active,
        )
        self.session.add(db_zone)
        await self.session.flush()
        return self._to_entity(db_zone)

    async def find_by_id(self, zone_id: str) -> ZoneDefinition | None:
        """Find zone by ID."""
        result = await self.session.execute(
            select(ZoneDefinitionModel).where(ZoneDefinitionModel.id == zone_id)
        )
        db_zone = result.scalar_one_or_none()
        return self._to_entity(db_zone) if db_zone else None

    async def find_by_nom(self, nom: str) -> ZoneDefinition | None:
        """Find zone by name."""
        result = await self.session.execute(
            select(ZoneDefinitionModel).where(ZoneDefinitionModel.nom == nom)
        )
        db_zone = result.scalar_one_or_none()
        return self._to_entity(db_zone) if db_zone else None

    async def find_all(self, include_inactive: bool = False) -> list[ZoneDefinition]:
        """Get all zone definitions."""
        query = select(ZoneDefinitionModel).order_by(ZoneDefinitionModel.ordre)
        if not include_inactive:
            query = query.where(ZoneDefinitionModel.is_active == True)  # noqa: E712
        result = await self.session.execute(query)
        return [self._to_entity(z) for z in result.scalars()]

    async def update(self, zone: ZoneDefinition) -> ZoneDefinition:
        """Update zone definition."""
        result = await self.session.execute(
            select(ZoneDefinitionModel).where(ZoneDefinitionModel.id == zone.id)
        )
        db_zone = result.scalar_one_or_none()
        if db_zone:
            db_zone.nom = zone.nom
            db_zone.description = zone.description
            db_zone.ordre = zone.ordre
            db_zone.prix = zone.prix
            db_zone.duree_minutes = zone.duree_minutes
            db_zone.categorie = zone.categorie
            db_zone.is_homme = zone.is_homme
            db_zone.is_active = zone.is_active
            await self.session.flush()
            return self._to_entity(db_zone)
        raise ValueError(f"Zone {zone.id} not found")

    async def delete(self, zone_id: str) -> bool:
        """Delete zone definition."""
        result = await self.session.execute(
            select(ZoneDefinitionModel).where(ZoneDefinitionModel.id == zone_id)
        )
        db_zone = result.scalar_one_or_none()
        if db_zone:
            await self.session.delete(db_zone)
            await self.session.flush()
            return True
        return False

    def _to_entity(self, model: ZoneDefinitionModel) -> ZoneDefinition:
        """Convert model to entity."""
        return ZoneDefinition(
            id=model.id,
            code=model.code,
            nom=model.nom,
            description=model.description,
            ordre=model.ordre,
            prix=model.prix,
            duree_minutes=model.duree_minutes,
            categorie=model.categorie,
            is_homme=model.is_homme,
            is_active=model.is_active,
            created_at=model.created_at,
        )


class PatientZoneRepository:
    """Repository for patient zone operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, patient_zone: PatientZone) -> PatientZone:
        """Create a new patient zone."""
        db_zone = PatientZoneModel(
            id=patient_zone.id,
            patient_id=patient_zone.patient_id,
            zone_id=patient_zone.zone_id,
            seances_total=patient_zone.seances_total,
            seances_used=patient_zone.seances_used,
            notes=patient_zone.notes,
        )
        self.session.add(db_zone)
        await self.session.flush()
        return await self.find_by_id(db_zone.id)  # type: ignore

    async def find_by_id(self, zone_id: str) -> PatientZone | None:
        """Find patient zone by ID."""
        result = await self.session.execute(
            select(PatientZoneModel)
            .options(joinedload(PatientZoneModel.zone))
            .where(PatientZoneModel.id == zone_id)
        )
        db_zone = result.unique().scalar_one_or_none()
        return self._to_entity(db_zone) if db_zone else None

    async def find_by_patient(self, patient_id: str) -> list[PatientZone]:
        """Find all zones for a patient."""
        result = await self.session.execute(
            select(PatientZoneModel)
            .options(joinedload(PatientZoneModel.zone))
            .where(PatientZoneModel.patient_id == patient_id)
            .order_by(PatientZoneModel.created_at)
        )
        return [self._to_entity(z) for z in result.unique().scalars()]

    async def find_by_patient_and_zone(self, patient_id: str, zone_id: str) -> PatientZone | None:
        """Find patient zone by patient and zone definition."""
        result = await self.session.execute(
            select(PatientZoneModel)
            .options(joinedload(PatientZoneModel.zone))
            .where(
                PatientZoneModel.patient_id == patient_id,
                PatientZoneModel.zone_id == zone_id,
            )
        )
        db_zone = result.unique().scalar_one_or_none()
        return self._to_entity(db_zone) if db_zone else None

    async def update(self, patient_zone: PatientZone) -> PatientZone:
        """Update patient zone."""
        result = await self.session.execute(
            select(PatientZoneModel).where(PatientZoneModel.id == patient_zone.id)
        )
        db_zone = result.scalar_one_or_none()
        if db_zone:
            db_zone.seances_total = patient_zone.seances_total
            db_zone.seances_used = patient_zone.seances_used
            db_zone.notes = patient_zone.notes
            await self.session.flush()
            return await self.find_by_id(db_zone.id)  # type: ignore
        raise ValueError(f"Patient zone {patient_zone.id} not found")

    async def delete(self, zone_id: str) -> bool:
        """Delete patient zone."""
        result = await self.session.execute(
            select(PatientZoneModel).where(PatientZoneModel.id == zone_id)
        )
        db_zone = result.scalar_one_or_none()
        if db_zone:
            await self.session.delete(db_zone)
            await self.session.flush()
            return True
        return False

    async def increment_seances(self, zone_id: str) -> PatientZone:
        """Increment sessions count for a patient zone."""
        result = await self.session.execute(
            select(PatientZoneModel).where(PatientZoneModel.id == zone_id)
        )
        db_zone = result.scalar_one_or_none()
        if db_zone:
            db_zone.seances_used += 1
            await self.session.flush()
            return await self.find_by_id(db_zone.id)  # type: ignore
        raise ValueError(f"Patient zone {zone_id} not found")

    def _to_entity(self, model: PatientZoneModel) -> PatientZone:
        """Convert model to entity."""
        return PatientZone(
            id=model.id,
            patient_id=model.patient_id,
            zone_id=model.zone_id,
            zone_nom=model.zone.nom if model.zone else "",
            seances_total=model.seances_total,
            seances_used=model.seances_used,
            notes=model.notes,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
