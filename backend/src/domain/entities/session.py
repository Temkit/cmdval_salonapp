"""Session domain entities."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4

# Default laser types
LASER_TYPES = [
    "Alexandrite (755nm)",
    "Diode (810nm)",
    "Nd:YAG (1064nm)",
    "IPL",
]


@dataclass
class SessionPhoto:
    """Photo attached to a session."""

    session_id: str
    filename: str
    filepath: str
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Session:
    """Treatment session (immutable once created)."""

    patient_id: str
    patient_zone_id: str
    praticien_id: str
    type_laser: str
    parametres: dict
    zone_nom: str = ""
    praticien_nom: str = ""
    patient_nom: str = ""
    patient_prenom: str = ""
    spot_size: int | None = None
    fluence: float | None = None
    pulse_duration_ms: int | None = None
    frequency_hz: float | None = None
    notes: str | None = None
    duree_minutes: int | None = None
    photos: list[SessionPhoto] = field(default_factory=list)
    id: str = field(default_factory=lambda: str(uuid4()))
    date_seance: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def add_photo(self, filename: str, filepath: str) -> SessionPhoto:
        """Add a photo to the session."""
        photo = SessionPhoto(
            session_id=self.id,
            filename=filename,
            filepath=filepath,
        )
        self.photos.append(photo)
        return photo
