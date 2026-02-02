"""Promotion repository implementation."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.promotion import Promotion
from src.infrastructure.database.models import PromotionModel


class PromotionRepository:
    """Repository for promotion operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, promotion: Promotion) -> Promotion:
        db = PromotionModel(
            id=promotion.id,
            nom=promotion.nom,
            type=promotion.type,
            valeur=promotion.valeur,
            zone_ids=promotion.zone_ids,
            date_debut=promotion.date_debut,
            date_fin=promotion.date_fin,
            is_active=promotion.is_active,
        )
        self.session.add(db)
        await self.session.flush()
        return self._to_entity(db)

    async def find_by_id(self, promotion_id: str) -> Promotion | None:
        result = await self.session.execute(
            select(PromotionModel).where(PromotionModel.id == promotion_id)
        )
        db = result.scalar_one_or_none()
        return self._to_entity(db) if db else None

    async def find_all(self, include_inactive: bool = False) -> list[Promotion]:
        query = select(PromotionModel).order_by(PromotionModel.created_at.desc())
        if not include_inactive:
            query = query.where(PromotionModel.is_active == True)  # noqa: E712
        result = await self.session.execute(query)
        return [self._to_entity(p) for p in result.scalars()]

    async def find_active(self) -> list[Promotion]:
        """Find currently active promotions (within date range)."""
        query = (
            select(PromotionModel)
            .where(
                PromotionModel.is_active == True,  # noqa: E712
            )
            .order_by(PromotionModel.created_at.desc())
        )
        result = await self.session.execute(query)
        promos = [self._to_entity(p) for p in result.scalars()]
        return [p for p in promos if p.is_currently_active]

    async def update(self, promotion: Promotion) -> Promotion:
        result = await self.session.execute(
            select(PromotionModel).where(PromotionModel.id == promotion.id)
        )
        db = result.scalar_one_or_none()
        if not db:
            raise ValueError(f"Promotion {promotion.id} not found")
        db.nom = promotion.nom
        db.type = promotion.type
        db.valeur = promotion.valeur
        db.zone_ids = promotion.zone_ids
        db.date_debut = promotion.date_debut
        db.date_fin = promotion.date_fin
        db.is_active = promotion.is_active
        await self.session.flush()
        return self._to_entity(db)

    async def delete(self, promotion_id: str) -> bool:
        result = await self.session.execute(
            select(PromotionModel).where(PromotionModel.id == promotion_id)
        )
        db = result.scalar_one_or_none()
        if db:
            db.is_active = False
            await self.session.flush()
            return True
        return False

    def _to_entity(self, model: PromotionModel) -> Promotion:
        return Promotion(
            id=model.id,
            nom=model.nom,
            type=model.type,
            valeur=model.valeur,
            zone_ids=model.zone_ids or [],
            date_debut=model.date_debut,
            date_fin=model.date_fin,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
