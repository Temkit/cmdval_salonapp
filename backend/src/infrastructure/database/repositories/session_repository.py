"""Session repository implementation."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.domain.entities.session import Session, SessionPhoto
from src.domain.interfaces.session_repository import SessionRepositoryInterface
from src.infrastructure.database.models import (
    PatientZoneModel,
    SessionModel,
    SessionPhotoModel,
    UserModel,
    ZoneDefinitionModel,
)


class SessionRepository(SessionRepositoryInterface):
    """Repository for session operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, session_entity: Session) -> Session:
        """Create a new session."""
        db_session = SessionModel(
            id=session_entity.id,
            patient_id=session_entity.patient_id,
            patient_zone_id=session_entity.patient_zone_id,
            praticien_id=session_entity.praticien_id,
            date_seance=session_entity.date_seance,
            type_laser=session_entity.type_laser,
            parametres=session_entity.parametres,
            spot_size=session_entity.spot_size,
            fluence=session_entity.fluence,
            pulse_duration_ms=session_entity.pulse_duration_ms,
            frequency_hz=session_entity.frequency_hz,
            notes=session_entity.notes,
            duree_minutes=session_entity.duree_minutes,
        )
        self.session.add(db_session)

        # Add photos
        for photo in session_entity.photos:
            db_photo = SessionPhotoModel(
                id=photo.id,
                session_id=session_entity.id,
                filename=photo.filename,
                filepath=photo.filepath,
            )
            self.session.add(db_photo)

        await self.session.flush()
        return await self.find_by_id(db_session.id)  # type: ignore

    async def find_by_id(self, session_id: str) -> Session | None:
        """Find session by ID."""
        result = await self.session.execute(
            select(SessionModel)
            .options(
                joinedload(SessionModel.patient_zone).joinedload(PatientZoneModel.zone),
                joinedload(SessionModel.praticien),
                joinedload(SessionModel.patient),
                joinedload(SessionModel.photos),
            )
            .where(SessionModel.id == session_id)
        )
        db_session = result.unique().scalar_one_or_none()
        return self._to_entity(db_session) if db_session else None

    async def find_by_patient(
        self,
        patient_id: str,
        page: int,
        size: int,
    ) -> tuple[list[Session], int]:
        """Find sessions for a patient."""
        base_query = select(SessionModel).where(SessionModel.patient_id == patient_id)

        # Count total
        count_result = await self.session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar() or 0

        # Get page
        result = await self.session.execute(
            base_query.options(
                joinedload(SessionModel.patient_zone).joinedload(PatientZoneModel.zone),
                joinedload(SessionModel.praticien),
                joinedload(SessionModel.patient),
                joinedload(SessionModel.photos),
            )
            .order_by(SessionModel.date_seance.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        sessions = [self._to_entity(s) for s in result.unique().scalars()]

        return sessions, total

    async def find_by_patient_with_zones(self, patient_id: str) -> list[Session]:
        """Find all sessions for a patient (no pagination, for alert checks)."""
        result = await self.session.execute(
            select(SessionModel)
            .where(SessionModel.patient_id == patient_id)
            .options(
                joinedload(SessionModel.patient_zone).joinedload(PatientZoneModel.zone),
                joinedload(SessionModel.praticien),
                joinedload(SessionModel.patient),
                joinedload(SessionModel.photos),
            )
            .order_by(SessionModel.date_seance.desc())
        )
        return [self._to_entity(s) for s in result.unique().scalars()]

    async def find_all(
        self,
        page: int,
        size: int,
        praticien_id: str | None = None,
        zone_id: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[Session], int]:
        """Find all sessions with filters."""
        base_query = select(SessionModel)

        if praticien_id:
            base_query = base_query.where(SessionModel.praticien_id == praticien_id)
        if zone_id:
            base_query = base_query.join(PatientZoneModel).where(
                PatientZoneModel.zone_id == zone_id
            )
        if date_from:
            base_query = base_query.where(SessionModel.date_seance >= date_from)
        if date_to:
            base_query = base_query.where(SessionModel.date_seance <= date_to)

        # Count total
        count_result = await self.session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar() or 0

        # Get page
        result = await self.session.execute(
            base_query.options(
                joinedload(SessionModel.patient_zone).joinedload(PatientZoneModel.zone),
                joinedload(SessionModel.praticien),
                joinedload(SessionModel.patient),
                joinedload(SessionModel.photos),
            )
            .order_by(SessionModel.date_seance.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        sessions = [self._to_entity(s) for s in result.unique().scalars()]

        return sessions, total

    async def find_last_by_patient_zone(
        self, patient_id: str, patient_zone_id: str
    ) -> Session | None:
        """Find the most recent session for a patient+zone combination."""
        result = await self.session.execute(
            select(SessionModel)
            .options(
                joinedload(SessionModel.patient_zone).joinedload(PatientZoneModel.zone),
                joinedload(SessionModel.praticien),
                joinedload(SessionModel.patient),
                joinedload(SessionModel.photos),
            )
            .where(
                SessionModel.patient_id == patient_id,
                SessionModel.patient_zone_id == patient_zone_id,
            )
            .order_by(SessionModel.date_seance.desc())
            .limit(1)
        )
        db_session = result.unique().scalar_one_or_none()
        return self._to_entity(db_session) if db_session else None

    async def count(self) -> int:
        """Count total sessions."""
        result = await self.session.execute(select(func.count(SessionModel.id)))
        return result.scalar() or 0

    async def count_today(self) -> int:
        """Count sessions today."""
        today = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
        result = await self.session.execute(
            select(func.count(SessionModel.id)).where(SessionModel.date_seance >= today)
        )
        return result.scalar() or 0

    async def count_this_month(self) -> int:
        """Count sessions this month."""
        now = datetime.now(UTC).replace(tzinfo=None)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = await self.session.execute(
            select(func.count(SessionModel.id)).where(SessionModel.date_seance >= start_of_month)
        )
        return result.scalar() or 0

    async def count_by_zone(self) -> list[dict]:
        """Count sessions grouped by zone."""
        result = await self.session.execute(
            select(
                ZoneDefinitionModel.id,
                ZoneDefinitionModel.nom,
                func.count(SessionModel.id).label("count"),
            )
            .join(
                PatientZoneModel,
                SessionModel.patient_zone_id == PatientZoneModel.id,
            )
            .join(
                ZoneDefinitionModel,
                PatientZoneModel.zone_id == ZoneDefinitionModel.id,
            )
            .group_by(ZoneDefinitionModel.id, ZoneDefinitionModel.nom)
            .order_by(func.count(SessionModel.id).desc())
        )
        return [{"zone_id": row[0], "zone_nom": row[1], "count": row[2]} for row in result.all()]

    async def count_by_praticien(self) -> list[dict]:
        """Count sessions grouped by praticien."""
        result = await self.session.execute(
            select(
                UserModel.id,
                func.concat(UserModel.prenom, " ", UserModel.nom).label("nom"),
                func.count(SessionModel.id).label("count"),
            )
            .join(UserModel, SessionModel.praticien_id == UserModel.id)
            .group_by(UserModel.id, UserModel.prenom, UserModel.nom)
            .order_by(func.count(SessionModel.id).desc())
        )
        return [
            {"praticien_id": row[0], "praticien_nom": row[1], "count": row[2]}
            for row in result.all()
        ]

    async def count_by_period(
        self,
        date_from: datetime,
        date_to: datetime,
        group_by: str,
    ) -> list[dict]:
        """Count sessions grouped by time period."""
        if group_by == "day":
            period_func = func.date(SessionModel.date_seance)
        elif group_by == "week":
            period_func = func.date_trunc("week", SessionModel.date_seance)
        else:  # month
            period_func = func.date_trunc("month", SessionModel.date_seance)

        result = await self.session.execute(
            select(
                period_func.label("period"),
                func.count(SessionModel.id).label("count"),
            )
            .where(
                SessionModel.date_seance >= date_from,
                SessionModel.date_seance <= date_to,
            )
            .group_by(period_func)
            .order_by(period_func)
        )
        return [{"period": str(row[0]), "count": row[1]} for row in result.all()]

    async def recent_activity(self, limit: int = 10) -> list[Session]:
        """Get recent sessions."""
        result = await self.session.execute(
            select(SessionModel)
            .options(
                joinedload(SessionModel.patient_zone).joinedload(PatientZoneModel.zone),
                joinedload(SessionModel.praticien),
                joinedload(SessionModel.patient),
                joinedload(SessionModel.photos),
            )
            .order_by(SessionModel.created_at.desc())
            .limit(limit)
        )
        return [self._to_entity(s) for s in result.unique().scalars()]

    async def add_photo(self, session_id: str, filename: str, filepath: str) -> SessionPhoto:
        """Add a photo to a session."""
        from uuid import uuid4

        photo = SessionPhotoModel(
            id=str(uuid4()),
            session_id=session_id,
            filename=filename,
            filepath=filepath,
        )
        self.session.add(photo)
        await self.session.flush()
        return SessionPhoto(
            id=photo.id,
            session_id=photo.session_id,
            filename=photo.filename,
            filepath=photo.filepath,
            created_at=photo.created_at,
        )

    def _to_entity(self, model: SessionModel) -> Session:
        """Convert model to entity."""
        photos = [
            SessionPhoto(
                id=p.id,
                session_id=p.session_id,
                filename=p.filename,
                filepath=p.filepath,
                created_at=p.created_at,
            )
            for p in model.photos
        ]

        zone_nom = ""
        if model.patient_zone and model.patient_zone.zone:
            zone_nom = model.patient_zone.zone.nom

        praticien_nom = ""
        if model.praticien:
            praticien_nom = f"{model.praticien.prenom} {model.praticien.nom}"

        patient_nom = ""
        patient_prenom = ""
        if model.patient:
            patient_nom = model.patient.nom or ""
            patient_prenom = model.patient.prenom or ""

        return Session(
            id=model.id,
            patient_id=model.patient_id,
            patient_zone_id=model.patient_zone_id,
            praticien_id=model.praticien_id,
            zone_nom=zone_nom,
            praticien_nom=praticien_nom,
            patient_nom=patient_nom,
            patient_prenom=patient_prenom,
            date_seance=model.date_seance,
            type_laser=model.type_laser,
            parametres=model.parametres,
            spot_size=model.spot_size,
            fluence=model.fluence,
            pulse_duration_ms=model.pulse_duration_ms,
            frequency_hz=model.frequency_hz,
            notes=model.notes,
            duree_minutes=model.duree_minutes,
            photos=photos,
            created_at=model.created_at,
        )
