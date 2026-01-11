"""Alert endpoints for patient safety alerts."""

from typing import Annotated

from fastapi import APIRouter, Depends

from src.api.v1.dependencies import (
    get_alert_service,
    require_permission,
)
from src.application.services.alert_service import AlertService
from src.schemas.alert import AlertResponse, PatientAlertsResponse

router = APIRouter(tags=["Alerts"])


@router.get("/patients/{patient_id}/alerts", response_model=PatientAlertsResponse)
async def get_patient_alerts(
    patient_id: str,
    _: Annotated[dict, Depends(require_permission("patients.view"))],
    alert_service: Annotated[AlertService, Depends(get_alert_service)],
):
    """Get all alerts for a patient."""
    alerts = await alert_service.get_patient_alerts(patient_id)
    error_count, warning_count = await alert_service.count_alerts(patient_id)

    return PatientAlertsResponse(
        patient_id=patient_id,
        alerts=[
            AlertResponse(
                type=a.type,
                severity=a.severity,
                message=a.message,
                zone_id=a.zone_id,
                zone_nom=a.zone_nom,
                details=a.details,
            )
            for a in alerts
        ],
        has_alerts=len(alerts) > 0,
        has_errors=error_count > 0,
        has_warnings=warning_count > 0,
        error_count=error_count,
        warning_count=warning_count,
    )


@router.get(
    "/patients/{patient_id}/zones/{zone_id}/alerts",
    response_model=PatientAlertsResponse,
)
async def get_zone_alerts(
    patient_id: str,
    zone_id: str,
    _: Annotated[dict, Depends(require_permission("patients.view"))],
    alert_service: Annotated[AlertService, Depends(get_alert_service)],
):
    """Get alerts for a specific zone of a patient."""
    alerts = await alert_service.get_zone_alerts(patient_id, zone_id)
    errors = sum(1 for a in alerts if a.is_error)
    warnings = sum(1 for a in alerts if a.is_warning)

    return PatientAlertsResponse(
        patient_id=patient_id,
        alerts=[
            AlertResponse(
                type=a.type,
                severity=a.severity,
                message=a.message,
                zone_id=a.zone_id,
                zone_nom=a.zone_nom,
                details=a.details,
            )
            for a in alerts
        ],
        has_alerts=len(alerts) > 0,
        has_errors=errors > 0,
        has_warnings=warnings > 0,
        error_count=errors,
        warning_count=warnings,
    )


@router.get("/patients/{patient_id}/alerts/summary")
async def get_alerts_summary(
    patient_id: str,
    _: Annotated[dict, Depends(require_permission("patients.view"))],
    alert_service: Annotated[AlertService, Depends(get_alert_service)],
):
    """Get a summary of alerts for a patient (counts only)."""
    has_alerts = await alert_service.has_alerts(patient_id)
    has_errors = await alert_service.has_errors(patient_id)
    error_count, warning_count = await alert_service.count_alerts(patient_id)

    return {
        "patient_id": patient_id,
        "has_alerts": has_alerts,
        "has_errors": has_errors,
        "error_count": error_count,
        "warning_count": warning_count,
    }
