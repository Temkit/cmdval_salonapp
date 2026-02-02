"""Zone domain entities."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4

ZONE_CATEGORIES = ["visage", "bras", "jambes", "corps", "homme"]


@dataclass
class ZoneDefinition:
    """Body zone definition."""

    code: str
    nom: str
    description: str | None = None
    ordre: int = 0
    prix: int | None = None
    duree_minutes: int | None = None
    categorie: str | None = None
    is_homme: bool = False
    is_active: bool = True
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)


# Default zone definitions (35 zones from PPT/Excel)
DEFAULT_ZONES = [
    # Visage
    ZoneDefinition(
        code="VISAGE_ENTIER",
        nom="Visage entier",
        prix=5000,
        duree_minutes=15,
        categorie="visage",
        ordre=1,
    ),
    ZoneDefinition(
        code="OVALE_VISAGE",
        nom="Ovale du visage",
        prix=2500,
        duree_minutes=10,
        categorie="visage",
        ordre=2,
    ),
    ZoneDefinition(
        code="PATTES", nom="Pattes", prix=2500, duree_minutes=10, categorie="visage", ordre=3
    ),
    ZoneDefinition(
        code="LIGNE_FRONTALE",
        nom="Ligne frontale",
        prix=3000,
        duree_minutes=10,
        categorie="visage",
        ordre=4,
    ),
    ZoneDefinition(code="COU", nom="Cou", prix=3500, duree_minutes=15, categorie="visage", ordre=5),
    ZoneDefinition(
        code="NUQUE", nom="Nuque", prix=3000, duree_minutes=15, categorie="visage", ordre=6
    ),
    ZoneDefinition(
        code="SOURCILS", nom="Sourcils", prix=2500, duree_minutes=5, categorie="visage", ordre=7
    ),
    ZoneDefinition(
        code="LEVRE_SUP",
        nom="Lèvre supérieure",
        prix=2000,
        duree_minutes=5,
        categorie="visage",
        ordre=8,
    ),
    ZoneDefinition(
        code="MENTON", nom="Menton", prix=2000, duree_minutes=10, categorie="visage", ordre=9
    ),
    # Bras
    ZoneDefinition(
        code="AISSELLES", nom="Aisselles", prix=4000, duree_minutes=5, categorie="bras", ordre=10
    ),
    ZoneDefinition(
        code="AVANT_BRAS", nom="Avant-bras", prix=7000, duree_minutes=10, categorie="bras", ordre=11
    ),
    ZoneDefinition(
        code="BRAS_ENTIERS",
        nom="Bras entiers",
        prix=9000,
        duree_minutes=15,
        categorie="bras",
        ordre=12,
    ),
    ZoneDefinition(
        code="BRAS_SUPERIEURS",
        nom="Bras supérieurs",
        prix=5000,
        duree_minutes=10,
        categorie="bras",
        ordre=13,
    ),
    ZoneDefinition(
        code="MAINS", nom="Mains", prix=2500, duree_minutes=5, categorie="bras", ordre=14
    ),
    # Jambes
    ZoneDefinition(
        code="JAMBES_COMPLETES",
        nom="Jambes complètes",
        prix=14000,
        duree_minutes=30,
        categorie="jambes",
        ordre=15,
    ),
    ZoneDefinition(
        code="DEMI_JAMBES",
        nom="Demi-jambes",
        prix=9000,
        duree_minutes=15,
        categorie="jambes",
        ordre=16,
    ),
    ZoneDefinition(
        code="CUISSES", nom="Cuisses", prix=10000, duree_minutes=15, categorie="jambes", ordre=17
    ),
    ZoneDefinition(
        code="PIEDS", nom="Pieds", prix=2000, duree_minutes=5, categorie="jambes", ordre=18
    ),
    # Corps
    ZoneDefinition(
        code="DECOLLETE", nom="Décolleté", prix=7000, duree_minutes=15, categorie="corps", ordre=19
    ),
    ZoneDefinition(
        code="DOS_HAUT", nom="Dos - Haut", prix=5000, duree_minutes=15, categorie="corps", ordre=20
    ),
    ZoneDefinition(
        code="DOS_BAS", nom="Dos - Bas", prix=4000, duree_minutes=15, categorie="corps", ordre=21
    ),
    ZoneDefinition(
        code="DOS_ENTIER",
        nom="Dos entier",
        prix=8000,
        duree_minutes=30,
        categorie="corps",
        ordre=22,
    ),
    ZoneDefinition(
        code="FESSES", nom="Fesses", prix=7000, duree_minutes=15, categorie="corps", ordre=23
    ),
    ZoneDefinition(
        code="TOUR_MAMELON",
        nom="Tour du mamelon",
        prix=3000,
        duree_minutes=5,
        categorie="corps",
        ordre=24,
    ),
    ZoneDefinition(
        code="VENTRE", nom="Ventre", prix=6000, duree_minutes=15, categorie="corps", ordre=25
    ),
    ZoneDefinition(
        code="MAILLOT_CLASSIQUE",
        nom="Maillot classique",
        prix=4000,
        duree_minutes=15,
        categorie="corps",
        ordre=26,
    ),
    ZoneDefinition(
        code="MAILLOT_BRESILIEN",
        nom="Maillot brésilien",
        prix=5000,
        duree_minutes=15,
        categorie="corps",
        ordre=27,
    ),
    ZoneDefinition(
        code="MAILLOT_ECHANCRE",
        nom="Maillot échancré",
        prix=6000,
        duree_minutes=15,
        categorie="corps",
        ordre=28,
    ),
    ZoneDefinition(
        code="MAILLOT_INTEGRAL",
        nom="Maillot intégral",
        prix=8000,
        duree_minutes=15,
        categorie="corps",
        ordre=29,
    ),
    ZoneDefinition(
        code="SILLON_INTERFESSIER",
        nom="Sillon interfessier",
        prix=3000,
        duree_minutes=5,
        categorie="corps",
        ordre=30,
    ),
    ZoneDefinition(
        code="LIGNE_MEDIANE",
        nom="Ligne médiane",
        prix=2500,
        duree_minutes=5,
        categorie="corps",
        ordre=31,
    ),
    ZoneDefinition(
        code="CORPS_COMPLET",
        nom="Corps complet",
        prix=45000,
        duree_minutes=75,
        categorie="corps",
        ordre=32,
    ),
    # Homme
    ZoneDefinition(
        code="CONTOUR_BARBE_H",
        nom="Contour de barbe (H)",
        prix=3500,
        duree_minutes=15,
        categorie="homme",
        is_homme=True,
        ordre=33,
    ),
    ZoneDefinition(
        code="DOS_ENTIER_H",
        nom="Dos entiers (H)",
        prix=14900,
        duree_minutes=30,
        categorie="homme",
        is_homme=True,
        ordre=34,
    ),
    ZoneDefinition(
        code="TORSE_H",
        nom="Torse (H)",
        prix=12000,
        duree_minutes=30,
        categorie="homme",
        is_homme=True,
        ordre=35,
    ),
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
