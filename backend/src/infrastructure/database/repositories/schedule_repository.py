"""Schedule and waiting queue repository implementations."""

from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.schedule import DailyScheduleEntry, WaitingQueueEntry
from src.infrastructure.database.models import DailyScheduleModel, WaitingQueueModel


class ScheduleRepository:
    """Repository for daily schedule operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_batch(self, entries: list[DailyScheduleEntry]) -> list[DailyScheduleEntry]:
        db_entries = []
        for entry in entries:
            db = DailyScheduleModel(
                id=entry.id,
                date=entry.date,
                patient_nom=entry.patient_nom,
                patient_prenom=entry.patient_prenom,
                patient_id=entry.patient_id,
                doctor_name=entry.doctor_name,
                doctor_id=entry.doctor_id,
                specialite=entry.specialite,
                duration_type=entry.duration_type,
                start_time=entry.start_time,
                end_time=entry.end_time,
                notes=entry.notes,
                status=entry.status,
                uploaded_by=entry.uploaded_by,
            )
            self.session.add(db)
            db_entries.append(db)
        await self.session.flush()
        return [self._to_entity(db) for db in db_entries]

    async def find_by_date(self, target_date: date) -> list[DailyScheduleEntry]:
        result = await self.session.execute(
            select(DailyScheduleModel)
            .where(DailyScheduleModel.date == target_date)
            .order_by(DailyScheduleModel.start_time)
        )
        return [self._to_entity(s) for s in result.scalars()]

    async def find_by_id(self, entry_id: str) -> DailyScheduleEntry | None:
        result = await self.session.execute(
            select(DailyScheduleModel).where(DailyScheduleModel.id == entry_id)
        )
        db = result.scalar_one_or_none()
        return self._to_entity(db) if db else None

    async def update_status(self, entry_id: str, status: str) -> DailyScheduleEntry | None:
        result = await self.session.execute(
            select(DailyScheduleModel).where(DailyScheduleModel.id == entry_id)
        )
        db = result.scalar_one_or_none()
        if db:
            db.status = status
            await self.session.flush()
            return self._to_entity(db)
        return None

    async def delete_by_date(self, target_date: date) -> int:
        """Delete all entries for a date (before re-upload)."""
        result = await self.session.execute(
            select(DailyScheduleModel).where(DailyScheduleModel.date == target_date)
        )
        entries = result.scalars().all()
        count = len(entries)
        for entry in entries:
            await self.session.delete(entry)
        await self.session.flush()
        return count

    def _to_entity(self, model: DailyScheduleModel) -> DailyScheduleEntry:
        return DailyScheduleEntry(
            id=model.id,
            date=model.date,
            patient_nom=model.patient_nom,
            patient_prenom=model.patient_prenom,
            patient_id=model.patient_id,
            doctor_name=model.doctor_name,
            doctor_id=model.doctor_id,
            specialite=model.specialite,
            duration_type=model.duration_type,
            start_time=model.start_time,
            end_time=model.end_time,
            notes=model.notes,
            status=model.status,
            uploaded_by=model.uploaded_by,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class WaitingQueueRepository:
    """Repository for waiting queue operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, entry: WaitingQueueEntry) -> WaitingQueueEntry:
        # Get next position
        result = await self.session.execute(
            select(func.max(WaitingQueueModel.position)).where(
                WaitingQueueModel.status == "waiting"
            )
        )
        max_pos = result.scalar() or 0
        entry.position = max_pos + 1

        db = WaitingQueueModel(
            id=entry.id,
            schedule_id=entry.schedule_id,
            patient_id=entry.patient_id,
            patient_name=entry.patient_name,
            doctor_id=entry.doctor_id,
            doctor_name=entry.doctor_name,
            box_id=entry.box_id,
            box_nom=entry.box_nom,
            checked_in_at=entry.checked_in_at,
            position=entry.position,
            status=entry.status,
        )
        self.session.add(db)
        await self.session.flush()
        return self._to_entity(db)

    async def find_by_id(self, entry_id: str) -> WaitingQueueEntry | None:
        result = await self.session.execute(
            select(WaitingQueueModel).where(WaitingQueueModel.id == entry_id)
        )
        db = result.scalar_one_or_none()
        return self._to_entity(db) if db else None

    async def find_active(self, doctor_id: str | None = None) -> list[WaitingQueueEntry]:
        query = select(WaitingQueueModel).where(
            WaitingQueueModel.status.in_(["waiting", "in_treatment"])
        )
        if doctor_id:
            query = query.where(WaitingQueueModel.doctor_id == doctor_id)
        query = query.order_by(WaitingQueueModel.position)
        result = await self.session.execute(query)
        return [self._to_entity(q) for q in result.scalars()]

    async def find_display(self) -> list[WaitingQueueEntry]:
        """Get queue for public display (waiting only, minimal info)."""
        result = await self.session.execute(
            select(WaitingQueueModel)
            .where(WaitingQueueModel.status == "waiting")
            .order_by(WaitingQueueModel.position)
        )
        return [self._to_entity(q) for q in result.scalars()]

    async def update_status(self, entry_id: str, status: str) -> WaitingQueueEntry | None:
        result = await self.session.execute(
            select(WaitingQueueModel).where(WaitingQueueModel.id == entry_id)
        )
        db = result.scalar_one_or_none()
        if db:
            db.status = status
            if status == "in_treatment":
                db.called_at = datetime.now(UTC).replace(tzinfo=None)
            elif status in ("done", "no_show", "left"):
                db.completed_at = datetime.now(UTC).replace(tzinfo=None)
            await self.session.flush()
            return self._to_entity(db)
        return None

    async def update_doctor(self, entry_id: str, doctor_id: str, doctor_name: str) -> WaitingQueueEntry | None:
        result = await self.session.execute(
            select(WaitingQueueModel).where(WaitingQueueModel.id == entry_id)
        )
        db = result.scalar_one_or_none()
        if db:
            db.doctor_id = doctor_id
            db.doctor_name = doctor_name
            await self.session.flush()
            return self._to_entity(db)
        return None

    async def update_box(self, entry_id: str, box_id: str, box_nom: str) -> None:
        result = await self.session.execute(
            select(WaitingQueueModel).where(WaitingQueueModel.id == entry_id)
        )
        db = result.scalar_one_or_none()
        if db:
            db.box_id = box_id
            db.box_nom = box_nom
            await self.session.flush()

    async def find_no_shows(self, patient_id: str | None = None) -> list[WaitingQueueEntry]:
        """Find entries with no_show status."""
        query = select(WaitingQueueModel).where(WaitingQueueModel.status == "no_show")
        if patient_id:
            query = query.where(WaitingQueueModel.patient_id == patient_id)
        query = query.order_by(WaitingQueueModel.checked_in_at.desc())
        result = await self.session.execute(query)
        return [self._to_entity(q) for q in result.scalars()]

    def _to_entity(self, model: WaitingQueueModel) -> WaitingQueueEntry:
        return WaitingQueueEntry(
            id=model.id,
            schedule_id=model.schedule_id,
            patient_id=model.patient_id,
            patient_name=model.patient_name,
            doctor_id=model.doctor_id,
            doctor_name=model.doctor_name,
            box_id=model.box_id,
            box_nom=model.box_nom,
            checked_in_at=model.checked_in_at,
            position=model.position,
            status=model.status,
            called_at=model.called_at,
            completed_at=model.completed_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
