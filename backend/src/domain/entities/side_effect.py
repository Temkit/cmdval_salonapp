"""Side effect domain entity."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import uuid4


@dataclass
class SideEffectPhoto:
    """Photo attached to a side effect."""

    filename: str
    filepath: str
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class SideEffect:
    """Side effect recorded during a session."""

    session_id: str
    description: str
    severity: Optional[str] = None  # 'mild', 'moderate', 'severe'
    photos: list[SideEffectPhoto] = field(default_factory=list)

    # Additional context
    zone_id: Optional[str] = None
    zone_nom: Optional[str] = None
    patient_id: Optional[str] = None

    # Metadata
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def is_severe(self) -> bool:
        """Check if side effect is severe."""
        return self.severity == "severe"
