"""Paiement repository implementation."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.domain.entities.paiement import Paiement
from src.infrastructure.database.models import PaiementModel


class PaiementRepository:
    """Repository for payment operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, paiement: Paiement) -> Paiement:
        db_paiement = PaiementModel(
            id=paiement.id,
            patient_id=paiement.patient_id,
            subscription_id=paiement.subscription_id,
            session_id=paiement.session_id,
            montant=paiement.montant,
            type=paiement.type,
            mode_paiement=paiement.mode_paiement,
            reference=paiement.reference,
            notes=paiement.notes,
            created_by=paiement.created_by,
            date_paiement=paiement.date_paiement,
        )
        self.session.add(db_paiement)
        await self.session.flush()
        return await self.find_by_id(db_paiement.id)  # type: ignore

    async def find_by_id(self, paiement_id: str) -> Paiement | None:
        result = await self.session.execute(
            select(PaiementModel)
            .options(joinedload(PaiementModel.patient))
            .where(PaiementModel.id == paiement_id)
        )
        db = result.unique().scalar_one_or_none()
        return self._to_entity(db) if db else None

    async def find_by_patient(self, patient_id: str) -> list[Paiement]:
        result = await self.session.execute(
            select(PaiementModel)
            .options(joinedload(PaiementModel.patient))
            .where(PaiementModel.patient_id == patient_id)
            .order_by(PaiementModel.date_paiement.desc())
        )
        return [self._to_entity(p) for p in result.unique().scalars()]

    async def find_all(
        self,
        patient_id: str | None = None,
        type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Paiement], int]:
        query = select(PaiementModel).options(joinedload(PaiementModel.patient))
        if patient_id:
            query = query.where(PaiementModel.patient_id == patient_id)
        if type:
            query = query.where(PaiementModel.type == type)
        if date_from:
            query = query.where(PaiementModel.date_paiement >= date_from)
        if date_to:
            query = query.where(PaiementModel.date_paiement <= date_to)

        count_result = await self.session.execute(
            select(func.count()).select_from(query.with_only_columns(PaiementModel.id).subquery())
        )
        total = count_result.scalar() or 0

        result = await self.session.execute(
            query.order_by(PaiementModel.date_paiement.desc()).offset((page - 1) * size).limit(size)
        )
        return [self._to_entity(p) for p in result.unique().scalars()], total

    async def get_revenue_stats(
        self,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict:
        query = select(
            func.sum(PaiementModel.montant).label("total"),
            func.count(PaiementModel.id).label("count"),
        )
        if date_from:
            query = query.where(PaiementModel.date_paiement >= date_from)
        if date_to:
            query = query.where(PaiementModel.date_paiement <= date_to)
        result = await self.session.execute(query)
        row = result.one()
        return {"total_revenue": row[0] or 0, "total_payments": row[1] or 0}

    async def get_revenue_by_type(
        self,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> list[dict]:
        query = select(
            PaiementModel.type,
            func.sum(PaiementModel.montant).label("total"),
            func.count(PaiementModel.id).label("count"),
        ).group_by(PaiementModel.type)
        if date_from:
            query = query.where(PaiementModel.date_paiement >= date_from)
        if date_to:
            query = query.where(PaiementModel.date_paiement <= date_to)
        result = await self.session.execute(query)
        return [
            {"type": row[0], "total": row[1] or 0, "count": row[2] or 0} for row in result.all()
        ]

    def _to_entity(self, model: PaiementModel) -> Paiement:
        patient_nom = model.patient.nom if model.patient else None
        patient_prenom = model.patient.prenom if model.patient else None
        return Paiement(
            id=model.id,
            patient_id=model.patient_id,
            subscription_id=model.subscription_id,
            session_id=model.session_id,
            montant=model.montant,
            type=model.type,
            mode_paiement=model.mode_paiement,
            reference=model.reference,
            notes=model.notes,
            created_by=model.created_by,
            patient_nom=patient_nom,
            patient_prenom=patient_prenom,
            date_paiement=model.date_paiement,
            created_at=model.created_at,
        )
