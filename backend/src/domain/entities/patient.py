"""Patient domain entity."""

from dataclasses import dataclass, field
from datetime import date, datetime
from uuid import uuid4


@dataclass
class Patient:
    """Patient domain entity."""

    code_carte: str
    nom: str
    prenom: str
    date_naissance: date
    sexe: str
    telephone: str
    created_by: str
    email: str | None = None
    adresse: str | None = None
    ville: str | None = None
    code_postal: str | None = None
    notes: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def age(self) -> int:
        """Calculate patient age."""
        today = date.today()
        return (
            today.year
            - self.date_naissance.year
            - (
                (today.month, today.day)
                < (self.date_naissance.month, self.date_naissance.day)
            )
        )

    @property
    def full_name(self) -> str:
        """Return full name."""
        return f"{self.prenom} {self.nom}"
