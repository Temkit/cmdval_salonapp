"""Promotion service."""

from datetime import date

from src.domain.entities.promotion import Promotion
from src.domain.exceptions import NotFoundError
from src.infrastructure.database.repositories.promotion_repository import PromotionRepository


class PromotionService:
    """Service for promotion operations."""

    def __init__(self, promotion_repo: PromotionRepository):
        self.promotion_repo = promotion_repo

    async def create_promotion(
        self,
        nom: str,
        type: str,
        valeur: float,
        zone_ids: list[str] | None = None,
        date_debut: date | None = None,
        date_fin: date | None = None,
    ) -> Promotion:
        promotion = Promotion(
            nom=nom,
            type=type,
            valeur=valeur,
            zone_ids=zone_ids or [],
            date_debut=date_debut,
            date_fin=date_fin,
        )
        return await self.promotion_repo.create(promotion)

    async def get_promotion(self, promotion_id: str) -> Promotion:
        promotion = await self.promotion_repo.find_by_id(promotion_id)
        if not promotion:
            raise NotFoundError(f"Promotion {promotion_id} non trouvée")
        return promotion

    async def get_all_promotions(self, include_inactive: bool = False) -> list[Promotion]:
        return await self.promotion_repo.find_all(include_inactive)

    async def get_active_promotions(self) -> list[Promotion]:
        return await self.promotion_repo.find_active()

    async def get_zone_price(self, zone_id: str, original_price: int) -> dict:
        """Get zone price with active promotions applied."""
        active = await self.promotion_repo.find_active()
        applicable = [p for p in active if p.applies_to_zone(zone_id)]

        if not applicable:
            return {
                "original_price": original_price,
                "final_price": original_price,
                "discount": 0,
                "promotions": [],
            }

        # Apply best promotion (highest discount)
        best_price = original_price
        for promo in applicable:
            discounted = promo.calculate_discount(original_price)
            if discounted < best_price:
                best_price = discounted

        return {
            "original_price": original_price,
            "final_price": best_price,
            "discount": original_price - best_price,
            "promotions": [
                {"id": p.id, "nom": p.nom, "type": p.type, "valeur": p.valeur} for p in applicable
            ],
        }

    async def update_promotion(self, promotion_id: str, **kwargs) -> Promotion:
        promotion = await self.get_promotion(promotion_id)
        for key, value in kwargs.items():
            if value is not None and hasattr(promotion, key):
                setattr(promotion, key, value)
        return await self.promotion_repo.update(promotion)

    async def delete_promotion(self, promotion_id: str) -> bool:
        await self.get_promotion(promotion_id)
        return await self.promotion_repo.delete(promotion_id)
