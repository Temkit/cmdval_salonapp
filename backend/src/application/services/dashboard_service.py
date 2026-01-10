"""Dashboard service."""

from datetime import datetime

from src.infrastructure.database.repositories import (
    PatientRepository,
    SessionRepository,
)


class DashboardService:
    """Service for dashboard statistics."""

    def __init__(
        self,
        patient_repository: PatientRepository,
        session_repository: SessionRepository,
    ):
        self.patient_repository = patient_repository
        self.session_repository = session_repository

    async def get_stats(self) -> dict:
        """Get dashboard statistics."""
        total_patients = await self.patient_repository.count()
        total_sessions = await self.session_repository.count()
        sessions_today = await self.session_repository.count_today()
        sessions_this_month = await self.session_repository.count_this_month()
        new_patients_this_month = await self.patient_repository.count_new_this_month()

        return {
            "total_patients": total_patients,
            "total_sessions": total_sessions,
            "sessions_today": sessions_today,
            "sessions_this_month": sessions_this_month,
            "new_patients_this_month": new_patients_this_month,
        }

    async def get_sessions_by_zone(self) -> list[dict]:
        """Get session count by zone."""
        return await self.session_repository.count_by_zone()

    async def get_sessions_by_praticien(self) -> list[dict]:
        """Get session count by praticien."""
        return await self.session_repository.count_by_praticien()

    async def get_sessions_by_period(
        self,
        date_from: datetime,
        date_to: datetime,
        group_by: str = "day",
    ) -> list[dict]:
        """Get session count by time period."""
        return await self.session_repository.count_by_period(
            date_from=date_from,
            date_to=date_to,
            group_by=group_by,
        )

    async def get_recent_activity(self, limit: int = 10) -> list[dict]:
        """Get recent activity."""
        sessions = await self.session_repository.recent_activity(limit)

        return [
            {
                "id": s.id,
                "type": "session",
                "patient_nom": "",  # Will be populated at API level
                "patient_prenom": "",
                "zone_nom": s.zone_nom,
                "praticien_nom": s.praticien_nom,
                "date": s.created_at,
            }
            for s in sessions
        ]
