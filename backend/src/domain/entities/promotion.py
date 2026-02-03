"""Promotion domain entity."""

from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from uuid import uuid4

PROMOTION_TYPES = ["pourcentage", "montant"]


@dataclass
class Promotion:
    """Promotion/discount definition."""

    nom: str
    type: str  # pourcentage, montant
    valeur: float
    zone_ids: list[str] = field(default_factory=list)  # empty = all zones
    date_debut: date | None = None
    date_fin: date | None = None
    is_active: bool = True
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))

    @property
    def is_currently_active(self) -> bool:
        """Check if promotion is currently active based on dates."""
        if not self.is_active:
            return False
        today = date.today()
        if self.date_debut and today < self.date_debut:
            return False
        if self.date_fin and today > self.date_fin:
            return False
        return True

    def applies_to_zone(self, zone_id: str) -> bool:
        """Check if promotion applies to a specific zone."""
        if not self.zone_ids:
            return True
        return zone_id in self.zone_ids

    def calculate_discount(self, original_price: int) -> int:
        """Calculate discounted price."""
        if self.type == "pourcentage":
            discount = original_price * self.valeur / 100
            return max(0, int(original_price - discount))
        else:  # montant
            return max(0, int(original_price - self.valeur))
