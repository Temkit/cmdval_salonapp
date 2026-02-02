"""Pydantic schemas for alerts."""

from typing import Any

from pydantic import Field

from src.schemas.base import AppBaseModel


class AlertResponse(AppBaseModel):
    """Response schema for an alert."""

    type: str  # 'contraindication', 'spacing', 'ineligible_zone', 'side_effect'
    severity: str  # 'warning', 'error'
    message: str
    zone_id: str | None = None
    zone_nom: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)


class PatientAlertsResponse(AppBaseModel):
    """Response schema for patient alerts."""

    patient_id: str
    alerts: list[AlertResponse] = Field(default_factory=list)
    has_alerts: bool = False
    has_errors: bool = False
    has_warnings: bool = False
    error_count: int = 0
    warning_count: int = 0
