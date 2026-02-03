"""Pack and subscription domain entities."""

from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from uuid import uuid4


@dataclass
class Pack:
    """Subscription pack definition."""

    nom: str
    prix: int  # DA
    description: str | None = None
    zone_ids: list[str] = field(default_factory=list)
    duree_jours: int | None = None
    seances_per_zone: int = 6
    is_active: bool = True
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


SUBSCRIPTION_TYPES = ["gold", "pack", "seance"]


@dataclass
class PatientSubscription:
    """Patient subscription to a pack or payment plan."""

    patient_id: str
    type: str  # gold, pack, seance
    pack_id: str | None = None
    date_debut: date | None = None
    date_fin: date | None = None
    is_active: bool = True
    montant_paye: int = 0  # DA
    notes: str | None = None
    pack_nom: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    @property
    def is_expired(self) -> bool:
        """Check if subscription has expired."""
        if self.date_fin is None:
            return False
        return date.today() > self.date_fin

    @property
    def days_remaining(self) -> int | None:
        """Days remaining on subscription."""
        if self.date_fin is None:
            return None
        delta = self.date_fin - date.today()
        return max(0, delta.days)
