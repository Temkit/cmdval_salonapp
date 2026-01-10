"""Zone domain entities."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4


@dataclass
class ZoneDefinition:
    """Body zone definition."""

    code: str
    nom: str
    description: str | None = None
    ordre: int = 0
    is_active: bool = True
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)


# Default zone definitions
DEFAULT_ZONES = [
    ZoneDefinition(code="VISAGE", nom="Visage complet", description="Incluant lèvre supérieure, menton, joues"),
    ZoneDefinition(code="LEVRE_SUP", nom="Lèvre supérieure", description="Zone au-dessus de la lèvre"),
    ZoneDefinition(code="MENTON", nom="Menton", description="Zone du menton"),
    ZoneDefinition(code="AISSELLES", nom="Aisselles", description="Les deux aisselles"),
    ZoneDefinition(code="MAILLOT_SIMPLE", nom="Maillot simple", description="Contour du maillot"),
    ZoneDefinition(code="MAILLOT_INTEGRAL", nom="Maillot intégral", description="Maillot complet"),
    ZoneDefinition(code="JAMBES_COMPLETES", nom="Jambes complètes", description="Des chevilles aux hanches"),
    ZoneDefinition(code="DEMI_JAMBES", nom="Demi-jambes", description="Genoux aux chevilles"),
    ZoneDefinition(code="CUISSES", nom="Cuisses", description="Des genoux aux hanches"),
    ZoneDefinition(code="BRAS_COMPLETS", nom="Bras complets", description="Des poignets aux épaules"),
    ZoneDefinition(code="AVANT_BRAS", nom="Avant-bras", description="Des poignets aux coudes"),
    ZoneDefinition(code="DOS", nom="Dos complet", description="Tout le dos"),
    ZoneDefinition(code="TORSE", nom="Torse", description="Poitrine masculine"),
    ZoneDefinition(code="VENTRE", nom="Ventre", description="Zone abdominale"),
    ZoneDefinition(code="FESSES", nom="Fesses", description="Zone des fesses"),
    ZoneDefinition(code="NUQUE", nom="Nuque", description="Arrière du cou"),
    ZoneDefinition(code="INTER_SOURCILS", nom="Inter-sourcils", description="Zone entre les sourcils"),
]


@dataclass
class PatientZone:
    """Patient zone subscription with session count."""

    patient_id: str
    zone_id: str
    seances_total: int
    zone_code: str = ""
    zone_nom: str = ""
    seances_used: int = 0
    notes: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def seances_restantes(self) -> int:
        """Calculate remaining sessions."""
        return self.seances_total - self.seances_used

    def has_remaining_sessions(self) -> bool:
        """Check if there are remaining sessions."""
        return self.seances_restantes > 0

    def use_session(self) -> None:
        """Use one session."""
        if not self.has_remaining_sessions():
            raise ValueError("No remaining sessions")
        self.seances_used += 1
