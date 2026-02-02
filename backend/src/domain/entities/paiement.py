"""Payment domain entity."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4

PAYMENT_TYPES = ["encaissement", "prise_en_charge", "hors_carte"]
PAYMENT_MODES = ["especes", "carte", "virement"]


@dataclass
class Paiement:
    """Payment record."""

    patient_id: str
    montant: int  # DA
    type: str  # encaissement, prise_en_charge, hors_carte
    subscription_id: str | None = None
    session_id: str | None = None
    mode_paiement: str | None = None  # especes, carte, virement
    reference: str | None = None
    notes: str | None = None
    created_by: str | None = None
    patient_nom: str | None = None
    patient_prenom: str | None = None
    date_paiement: datetime = field(default_factory=datetime.utcnow)
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
