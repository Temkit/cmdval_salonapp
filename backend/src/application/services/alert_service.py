"""Alert service for computing patient alerts."""

from datetime import datetime, timezone

from src.domain.entities.alert import Alert
from src.infrastructure.database.repositories import (
    PreConsultationRepository,
    SessionRepository,
)
from src.infrastructure.database.repositories.side_effect_repository import (
    SideEffectRepository,
)

# Alert thresholds (configurable)
SESSION_SPACING_WARNING_DAYS = 60  # Warn if > 60 days since last session
SESSION_SPACING_TOO_CLOSE_DAYS = 14  # Warn if < 14 days since last session on same zone


class AlertService:
    """Service for computing patient alerts."""

    def __init__(
        self,
        pre_consultation_repo: PreConsultationRepository,
        session_repo: SessionRepository,
        side_effect_repo: SideEffectRepository,
    ):
        self.pre_consultation_repo = pre_consultation_repo
        self.session_repo = session_repo
        self.side_effect_repo = side_effect_repo

    async def get_patient_alerts(self, patient_id: str) -> list[Alert]:
        """Get all alerts for a patient."""
        alerts = []

        # 1. Check for validated pre-consultation
        pre_consultation = await self.pre_consultation_repo.find_by_patient_id(patient_id)
        if not pre_consultation:
            alerts.append(
                Alert(
                    type="no_pre_consultation",
                    severity="warning",
                    message="Rappel: pre-consultation recommandee avant la premiere seance",
                    details={"reason": "missing_pre_consultation"},
                )
            )
        elif (
            pre_consultation.status != "patient_created" and pre_consultation.status != "validated"
        ):
            alerts.append(
                Alert(
                    type="pre_consultation_pending",
                    severity="warning",
                    message=f"Pre-consultation en attente de validation (statut: {pre_consultation.status})",
                    details={"status": pre_consultation.status},
                )
            )

        # 2. Contraindication alerts (pregnancy/breastfeeding)
        if pre_consultation:
            if pre_consultation.is_pregnant:
                alerts.append(
                    Alert(
                        type="contraindication",
                        severity="error",
                        message="Patiente enceinte - Traitement laser déconseillé",
                        details={"reason": "pregnancy"},
                    )
                )
            if pre_consultation.is_breastfeeding:
                alerts.append(
                    Alert(
                        type="contraindication",
                        severity="error",
                        message="Patiente allaitante - Traitement laser déconseillé",
                        details={"reason": "breastfeeding"},
                    )
                )
                alerts.append(
                    Alert(
                        type="breastfeeding_sun_warning",
                        severity="warning",
                        message="Allaitement: risque accru de sensibilité au laser et aux UV. Protection solaire obligatoire.",
                        details={"reason": "breastfeeding_sun_exposure"},
                    )
                )
            if pre_consultation.pregnancy_planning:
                alerts.append(
                    Alert(
                        type="contraindication",
                        severity="warning",
                        message="Projet de grossesse - Informer sur les précautions",
                        details={"reason": "pregnancy_planning"},
                    )
                )

            # 2. Ineligible zone alerts
            for zone in pre_consultation.zones:
                if not zone.is_eligible:
                    alerts.append(
                        Alert(
                            type="ineligible_zone",
                            severity="error",
                            message=f"Zone non éligible: {zone.observations or 'Voir préconsultation'}",
                            zone_id=zone.zone_id,
                            zone_nom=zone.zone_nom,
                            details={"observations": zone.observations},
                        )
                    )

        # 3. Session spacing alerts (per zone)
        zones_last_session = await self._get_last_session_per_zone(patient_id)
        for zone_id, (last_session_date, zone_nom) in zones_last_session.items():
            # Ensure both datetimes are naive for comparison
            now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
            session_date = last_session_date.replace(tzinfo=None) if last_session_date.tzinfo else last_session_date
            days_since = (now_naive - session_date).days
            if days_since > SESSION_SPACING_WARNING_DAYS:
                alerts.append(
                    Alert(
                        type="spacing",
                        severity="warning",
                        message=f"Dernière séance il y a {days_since} jours - Risque de repousse",
                        zone_id=zone_id,
                        zone_nom=zone_nom,
                        details={
                            "days_since": days_since,
                            "last_session": last_session_date.isoformat(),
                            "threshold_days": SESSION_SPACING_WARNING_DAYS,
                        },
                    )
                )
            elif days_since < SESSION_SPACING_TOO_CLOSE_DAYS:
                alerts.append(
                    Alert(
                        type="spacing_too_close",
                        severity="warning",
                        message=f"Dernière séance il y a seulement {days_since} jours - Séances trop rapprochées",
                        zone_id=zone_id,
                        zone_nom=zone_nom,
                        details={
                            "days_since": days_since,
                            "last_session": last_session_date.isoformat(),
                            "threshold_days": SESSION_SPACING_TOO_CLOSE_DAYS,
                        },
                    )
                )

        # 4. Previous side effects alerts
        side_effects = await self.side_effect_repo.find_by_patient(patient_id)
        zones_with_effects = set()
        for effect in side_effects:
            if effect.zone_id and effect.zone_id not in zones_with_effects:
                zones_with_effects.add(effect.zone_id)
                severity = "warning"
                if effect.is_severe:
                    severity = "error"
                alerts.append(
                    Alert(
                        type="side_effect",
                        severity=severity,
                        message=f"Effets secondaires précédents: {effect.description[:50]}...",
                        zone_id=effect.zone_id,
                        zone_nom=effect.zone_nom,
                        details={
                            "description": effect.description,
                            "severity": effect.severity,
                            "date": effect.created_at.isoformat(),
                        },
                    )
                )

        return alerts

    async def get_zone_alerts(self, patient_id: str, zone_id: str) -> list[Alert]:
        """Get alerts for a specific zone."""
        all_alerts = await self.get_patient_alerts(patient_id)
        # Return alerts that are global (no zone_id) or for this specific zone
        return [a for a in all_alerts if a.zone_id is None or a.zone_id == zone_id]

    async def _get_last_session_per_zone(self, patient_id: str) -> dict[str, tuple[datetime, str]]:
        """Get last session date per zone for a patient."""
        sessions = await self.session_repo.find_by_patient_with_zones(patient_id)

        zones_last_session = {}
        for session in sessions:
            zone_key = session.patient_zone_id
            if zone_key:
                if (
                    zone_key not in zones_last_session
                    or session.date_seance > zones_last_session[zone_key][0]
                ):
                    zones_last_session[zone_key] = (
                        session.date_seance,
                        session.zone_nom or "Zone inconnue",
                    )

        return zones_last_session

    async def has_alerts(self, patient_id: str) -> bool:
        """Check if patient has any alerts."""
        alerts = await self.get_patient_alerts(patient_id)
        return len(alerts) > 0

    async def has_errors(self, patient_id: str) -> bool:
        """Check if patient has any error-level alerts."""
        alerts = await self.get_patient_alerts(patient_id)
        return any(a.is_error for a in alerts)

    async def count_alerts(self, patient_id: str) -> tuple[int, int]:
        """Count alerts by severity (errors, warnings)."""
        alerts = await self.get_patient_alerts(patient_id)
        errors = sum(1 for a in alerts if a.is_error)
        warnings = sum(1 for a in alerts if a.is_warning)
        return errors, warnings
