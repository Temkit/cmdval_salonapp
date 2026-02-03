"""Box (treatment room) domain entities."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import uuid4


@dataclass
class Box:
    """Treatment room."""

    nom: str
    numero: int
    is_active: bool = True
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))


@dataclass
class BoxAssignment:
    """Tracks which doctor is in which box."""

    box_id: str
    user_id: str
    box_nom: str = ""
    user_nom: str = ""
    user_prenom: str = ""
    assigned_at: datetime = field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    id: str = field(default_factory=lambda: str(uuid4()))
