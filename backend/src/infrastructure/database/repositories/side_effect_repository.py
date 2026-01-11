"""Side effect repository implementation."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.entities.side_effect import SideEffect, SideEffectPhoto
from src.infrastructure.database.models import (
    SessionModel,
    SessionSideEffectModel,
    SideEffectPhotoModel,
)


class SideEffectRepository:
    """Repository for side effect operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, side_effect: SideEffect) -> SideEffect:
        """Create a new side effect."""
        db_side_effect = SessionSideEffectModel(
            id=side_effect.id,
            session_id=side_effect.session_id,
            description=side_effect.description,
            severity=side_effect.severity,
        )
        self.session.add(db_side_effect)
        await self.session.flush()

        # Create photos
        for photo in side_effect.photos:
            db_photo = SideEffectPhotoModel(
                id=photo.id,
                side_effect_id=side_effect.id,
                filename=photo.filename,
                filepath=photo.filepath,
            )
            self.session.add(db_photo)

        await self.session.flush()
        return await self.find_by_id(side_effect.id)

    async def find_by_id(self, side_effect_id: str) -> Optional[SideEffect]:
        """Find side effect by ID."""
        result = await self.session.execute(
            select(SessionSideEffectModel)
            .options(
                selectinload(SessionSideEffectModel.photos),
                selectinload(SessionSideEffectModel.session).selectinload(
                    SessionModel.patient_zone
                ),
            )
            .where(SessionSideEffectModel.id == side_effect_id)
        )
        db_side_effect = result.scalar_one_or_none()
        return self._to_entity(db_side_effect) if db_side_effect else None

    async def find_by_session(self, session_id: str) -> list[SideEffect]:
        """Find all side effects for a session."""
        result = await self.session.execute(
            select(SessionSideEffectModel)
            .options(
                selectinload(SessionSideEffectModel.photos),
                selectinload(SessionSideEffectModel.session).selectinload(
                    SessionModel.patient_zone
                ),
            )
            .where(SessionSideEffectModel.session_id == session_id)
            .order_by(SessionSideEffectModel.created_at.desc())
        )
        return [self._to_entity(se) for se in result.scalars()]

    async def find_by_patient(self, patient_id: str) -> list[SideEffect]:
        """Find all side effects for a patient."""
        result = await self.session.execute(
            select(SessionSideEffectModel)
            .join(SessionModel)
            .options(
                selectinload(SessionSideEffectModel.photos),
                selectinload(SessionSideEffectModel.session).selectinload(
                    SessionModel.patient_zone
                ),
            )
            .where(SessionModel.patient_id == patient_id)
            .order_by(SessionSideEffectModel.created_at.desc())
        )
        return [self._to_entity(se) for se in result.scalars()]

    async def find_by_zone(self, patient_id: str, zone_id: str) -> list[SideEffect]:
        """Find all side effects for a specific zone of a patient."""
        from src.infrastructure.database.models import PatientZoneModel

        result = await self.session.execute(
            select(SessionSideEffectModel)
            .join(SessionModel)
            .join(PatientZoneModel, SessionModel.patient_zone_id == PatientZoneModel.id)
            .options(
                selectinload(SessionSideEffectModel.photos),
                selectinload(SessionSideEffectModel.session).selectinload(
                    SessionModel.patient_zone
                ),
            )
            .where(
                SessionModel.patient_id == patient_id,
                PatientZoneModel.zone_id == zone_id,
            )
            .order_by(SessionSideEffectModel.created_at.desc())
        )
        return [self._to_entity(se) for se in result.scalars()]

    async def add_photo(
        self, side_effect_id: str, photo: SideEffectPhoto
    ) -> SideEffectPhoto:
        """Add photo to side effect."""
        db_photo = SideEffectPhotoModel(
            id=photo.id,
            side_effect_id=side_effect_id,
            filename=photo.filename,
            filepath=photo.filepath,
        )
        self.session.add(db_photo)
        await self.session.flush()
        return photo

    async def delete(self, side_effect_id: str) -> bool:
        """Delete side effect."""
        result = await self.session.execute(
            select(SessionSideEffectModel).where(
                SessionSideEffectModel.id == side_effect_id
            )
        )
        db_side_effect = result.scalar_one_or_none()
        if db_side_effect:
            await self.session.delete(db_side_effect)
            await self.session.flush()
            return True
        return False

    def _to_entity(self, model: SessionSideEffectModel) -> SideEffect:
        """Convert model to entity."""
        photos = [
            SideEffectPhoto(
                id=p.id,
                filename=p.filename,
                filepath=p.filepath,
                created_at=p.created_at,
            )
            for p in model.photos
        ] if model.photos else []

        # Get zone info from session
        zone_id = None
        zone_nom = None
        patient_id = None
        if model.session and model.session.patient_zone:
            zone_id = model.session.patient_zone.zone_id
            patient_id = model.session.patient_id
            if model.session.patient_zone.zone:
                zone_nom = model.session.patient_zone.zone.nom

        return SideEffect(
            id=model.id,
            session_id=model.session_id,
            description=model.description,
            severity=model.severity,
            photos=photos,
            zone_id=zone_id,
            zone_nom=zone_nom,
            patient_id=patient_id,
            created_at=model.created_at,
        )
