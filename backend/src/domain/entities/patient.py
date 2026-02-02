"""Patient domain entity."""

from dataclasses import dataclass, field
from datetime import date, datetime
from uuid import uuid4

# Patient status values
PATIENT_STATUS_EN_ATTENTE = "en_attente_evaluation"
PATIENT_STATUS_ACTIF = "actif"
PATIENT_STATUS_INELIGIBLE = "ineligible"


@dataclass
class Patient:
    """Patient domain entity."""

    code_carte: str
    nom: str
    prenom: str
    date_naissance: date | None = None
    sexe: str | None = None
    telephone: str | None = None
    email: str | None = None
    adresse: str | None = None
    ville: str | None = None
    code_postal: str | None = None
    notes: str | None = None
    phototype: str | None = None
    status: str = PATIENT_STATUS_EN_ATTENTE  # en_attente_evaluation, actif, ineligible
    created_by: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def age(self) -> int | None:
        """Calculate patient age."""
        if not self.date_naissance:
            return None
        today = date.today()
        return (
            today.year
            - self.date_naissance.year
            - ((today.month, today.day) < (self.date_naissance.month, self.date_naissance.day))
        )

    @property
    def full_name(self) -> str:
        """Return full name."""
        return f"{self.prenom} {self.nom}"
