"""Alert domain entity."""

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class Alert:
    """Alert for patient or zone."""

    type: str  # 'contraindication', 'spacing', 'ineligible_zone', 'side_effect'
    severity: str  # 'warning', 'error'
    message: str
    zone_id: Optional[str] = None
    zone_nom: Optional[str] = None
    details: dict[str, Any] = field(default_factory=dict)

    @property
    def is_error(self) -> bool:
        """Check if alert is an error."""
        return self.severity == "error"

    @property
    def is_warning(self) -> bool:
        """Check if alert is a warning."""
        return self.severity == "warning"
