"""Dashboard service."""

from collections import defaultdict
from datetime import date, datetime

from dateutil.relativedelta import relativedelta
from sqlalchemy import func, select

from src.infrastructure.database.models import (
    PaiementModel,
    PatientModel,
    SessionModel,
    SessionSideEffectModel,
    UserModel,
)
from src.infrastructure.database.repositories import (
    PaiementRepository,
    PatientRepository,
    SessionRepository,
    SideEffectRepository,
)


class DashboardService:
    """Service for dashboard statistics."""

    def __init__(
        self,
        patient_repository: PatientRepository,
        session_repository: SessionRepository,
        side_effect_repository: SideEffectRepository,
        paiement_repository: PaiementRepository,
    ):
        self.patient_repository = patient_repository
        self.session_repository = session_repository
        self.side_effect_repository = side_effect_repository
        self.paiement_repository = paiement_repository

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
                "patient_nom": s.patient_nom or "",
                "patient_prenom": s.patient_prenom or "",
                "zone_nom": s.zone_nom or "",
                "praticien_nom": s.praticien_nom or "",
                "date": s.created_at,
                "description": f"Séance {s.zone_nom or 'traitement'} - {s.patient_prenom or ''} {s.patient_nom or ''}".strip(),
                "timestamp": s.created_at,
            }
            for s in sessions
        ]

    async def get_side_effect_stats(self) -> dict:
        """Get side effect statistics: count by severity and monthly trend (last 6 months)."""
        db = self.side_effect_repository.session

        # Total count
        total_result = await db.execute(select(func.count(SessionSideEffectModel.id)))
        total = total_result.scalar() or 0

        # Count by severity
        severity_result = await db.execute(
            select(
                func.coalesce(SessionSideEffectModel.severity, "non_specifie").label("severity"),
                func.count(SessionSideEffectModel.id).label("count"),
            ).group_by(SessionSideEffectModel.severity)
        )
        by_severity = [
            {"severity": row[0] or "non_specifie", "count": row[1]} for row in severity_result.all()
        ]

        # Monthly trend (last 6 months)
        six_months_ago = datetime.utcnow() - relativedelta(months=6)
        month_col = func.date_trunc("month", SessionSideEffectModel.created_at).label("month")
        trend_result = await db.execute(
            select(
                month_col,
                func.count(SessionSideEffectModel.id).label("count"),
            )
            .where(SessionSideEffectModel.created_at >= six_months_ago)
            .group_by(month_col)
            .order_by(month_col)
        )
        trend = [{"month": row[0].strftime("%Y-%m"), "count": row[1]} for row in trend_result.all()]

        return {
            "total": total,
            "by_severity": by_severity,
            "trend": trend,
        }

    async def get_doctor_performance(self) -> dict:
        """Get average session duration per doctor compared to overall average."""
        db = self.session_repository.session

        # Per-doctor stats (only sessions with duree_minutes recorded)
        doctor_result = await db.execute(
            select(
                UserModel.id.label("doctor_id"),
                func.concat(UserModel.prenom, " ", UserModel.nom).label("doctor_name"),
                func.avg(SessionModel.duree_minutes).label("avg_duration"),
                func.count(SessionModel.id).label("total_sessions"),
            )
            .join(UserModel, SessionModel.praticien_id == UserModel.id)
            .where(SessionModel.duree_minutes.is_not(None))
            .group_by(UserModel.id, UserModel.prenom, UserModel.nom)
            .order_by(func.count(SessionModel.id).desc())
        )
        rows = doctor_result.all()

        # Overall average duration
        overall_result = await db.execute(
            select(func.avg(SessionModel.duree_minutes)).where(
                SessionModel.duree_minutes.is_not(None)
            )
        )
        overall_avg = float(overall_result.scalar() or 0)

        doctors = []
        for row in rows:
            avg_dur = float(row[2] or 0)
            comparison = ((avg_dur - overall_avg) / overall_avg * 100) if overall_avg > 0 else 0.0
            doctors.append(
                {
                    "doctor_id": row[0],
                    "doctor_name": row[1],
                    "avg_duration_minutes": round(avg_dur, 1),
                    "total_sessions": row[3],
                    "comparison_to_avg": round(comparison, 1),
                }
            )

        return {
            "doctors": doctors,
            "overall_avg_duration": round(overall_avg, 1),
        }

    async def get_revenue_stats(
        self,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict:
        """Get revenue statistics: totals, by type, and by month."""
        db = self.paiement_repository.session

        # Total revenue
        stats = await self.paiement_repository.get_revenue_stats(
            date_from=date_from, date_to=date_to
        )
        total_revenue = stats["total_revenue"]

        # Revenue by type
        revenue_by_type = await self.paiement_repository.get_revenue_by_type(
            date_from=date_from, date_to=date_to
        )

        # Revenue by period (monthly)
        period_col = func.date_trunc("month", PaiementModel.date_paiement).label("period")
        period_query = (
            select(
                period_col,
                func.sum(PaiementModel.montant).label("total"),
            )
            .group_by(period_col)
            .order_by(period_col)
        )
        if date_from:
            period_query = period_query.where(PaiementModel.date_paiement >= date_from)
        if date_to:
            period_query = period_query.where(PaiementModel.date_paiement <= date_to)

        period_result = await db.execute(period_query)
        revenue_by_period = [
            {"period": row[0].strftime("%Y-%m"), "total": row[1] or 0}
            for row in period_result.all()
        ]

        return {
            "total_revenue": total_revenue,
            "revenue_by_type": revenue_by_type,
            "revenue_by_period": revenue_by_period,
        }

    async def get_demographics(self) -> dict:
        """Get patient demographics: age distribution and city distribution."""
        db = self.patient_repository.session

        # Age distribution
        today = date.today()
        result = await db.execute(
            select(PatientModel.date_naissance).where(PatientModel.date_naissance.is_not(None))
        )
        dates_of_birth = [row[0] for row in result.all()]

        age_ranges = [
            ("0-18", 0, 18),
            ("18-25", 18, 25),
            ("26-35", 26, 35),
            ("36-45", 36, 45),
            ("46-55", 46, 55),
            ("56-65", 56, 65),
            ("65+", 65, 999),
        ]
        age_counts: dict[str, int] = defaultdict(int)
        for dob in dates_of_birth:
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            for label, low, high in age_ranges:
                if low <= age <= high:
                    age_counts[label] += 1
                    break

        age_distribution = [
            {"range": label, "count": age_counts.get(label, 0)} for label, _, _ in age_ranges
        ]

        # City distribution
        city_result = await db.execute(
            select(
                func.coalesce(PatientModel.ville, "Non renseigné").label("city"),
                func.count(PatientModel.id).label("count"),
            )
            .group_by(PatientModel.ville)
            .order_by(func.count(PatientModel.id).desc())
        )
        city_distribution = [
            {"city": row[0] or "Non renseigné", "count": row[1]} for row in city_result.all()
        ]

        return {
            "age_distribution": age_distribution,
            "city_distribution": city_distribution,
        }
