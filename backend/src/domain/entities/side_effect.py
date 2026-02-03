"""Side effect domain entity."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import uuid4


@dataclass
class SideEffectPhoto:
    """Photo attached to a side effect."""

    filename: str
    filepath: str
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class SideEffect:
    """Side effect recorded during a session."""

    session_id: str
    description: str
    severity: str | None = None  # 'mild', 'moderate', 'severe'
    photos: list[SideEffectPhoto] = field(default_factory=list)

    # Additional context
    zone_id: str | None = None
    zone_nom: str | None = None
    patient_id: str | None = None

    # Metadata
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    @property
    def is_severe(self) -> bool:
        """Check if side effect is severe."""
        return self.severity == "severe"
