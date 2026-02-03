"""Dashboard schemas."""

from datetime import datetime

from pydantic import Field

from src.schemas.base import AppBaseModel


class DashboardStatsResponse(AppBaseModel):
    """Dashboard statistics response."""

    total_patients: int
    total_sessions: int
    sessions_today: int
    sessions_this_month: int
    new_patients_this_month: int


class ZoneStatsItem(AppBaseModel):
    """Zone statistics item."""

    zone_id: str
    zone_nom: str
    count: int


class ZoneStatsResponse(AppBaseModel):
    """Zone statistics response."""

    zones: list[ZoneStatsItem]


class PraticienStatsItem(AppBaseModel):
    """Praticien statistics item."""

    praticien_id: str
    praticien_nom: str
    count: int


class PraticienStatsResponse(AppBaseModel):
    """Praticien statistics response."""

    praticiens: list[PraticienStatsItem]


class PeriodStatsItem(AppBaseModel):
    """Period statistics item."""

    period: str
    count: int


class PeriodStatsResponse(AppBaseModel):
    """Period statistics response."""

    data: list[PeriodStatsItem]
    group_by: str


class RecentActivityItem(AppBaseModel):
    """Recent activity item."""

    id: str
    type: str = "session"
    patient_nom: str
    patient_prenom: str
    zone_nom: str
    praticien_nom: str
    date: datetime
    description: str
    timestamp: datetime


class RecentActivityResponse(AppBaseModel):
    """Recent activity response."""

    activities: list[RecentActivityItem]


class PeriodStatsRequest(AppBaseModel):
    """Period statistics request."""

    date_from: datetime
    date_to: datetime
    group_by: str = Field(default="day", pattern=r"^(day|week|month)$")


# Phase 10 - Enhanced dashboard schemas


class SeverityCountItem(AppBaseModel):
    """Side effect count by severity."""

    severity: str
    count: int


class MonthlyTrendItem(AppBaseModel):
    """Monthly trend item."""

    month: str
    count: int


class SideEffectStatsResponse(AppBaseModel):
    """Side effect statistics response."""

    total: int
    by_severity: list[SeverityCountItem]
    trend: list[MonthlyTrendItem]


class DoctorPerformanceItem(AppBaseModel):
    """Doctor performance metrics."""

    doctor_id: str
    doctor_name: str
    avg_duration_minutes: float
    total_sessions: int
    comparison_to_avg: float
    expected_avg_duration: float = 0.0
    status: str = "normal"  # "normal", "trop_lent", "trop_rapide"


class DoctorPerformanceResponse(AppBaseModel):
    """Doctor performance response."""

    doctors: list[DoctorPerformanceItem]
    overall_avg_duration: float


class RevenueByTypeItem(AppBaseModel):
    """Revenue breakdown by payment type."""

    type: str
    total: int
    count: int


class RevenueByPeriodItem(AppBaseModel):
    """Revenue breakdown by period."""

    period: str
    total: int


class RevenueStatsResponse(AppBaseModel):
    """Revenue statistics response."""

    total_revenue: int
    revenue_by_type: list[RevenueByTypeItem]
    revenue_by_period: list[RevenueByPeriodItem]
    hors_carte_revenue: int = 0
    hors_carte_count: int = 0
    pack_revenue: int = 0
    pack_count: int = 0


class AgeDistributionItem(AppBaseModel):
    """Age distribution item."""

    range: str
    count: int


class CityDistributionItem(AppBaseModel):
    """City distribution item."""

    city: str
    count: int


class DemographicsResponse(AppBaseModel):
    """Demographics statistics response."""

    age_distribution: list[AgeDistributionItem]
    city_distribution: list[CityDistributionItem]


class LostTimeItem(AppBaseModel):
    """Lost time per doctor."""

    doctor_id: str
    doctor_name: str
    total_expected_minutes: float
    total_actual_minutes: float
    lost_minutes: float
    session_count: int


class LostTimeByLaserItem(AppBaseModel):
    """Lost time per laser type."""

    type_laser: str
    total_expected_minutes: float
    total_actual_minutes: float
    lost_minutes: float
    session_count: int


class LostTimeStatsResponse(AppBaseModel):
    """Lost time statistics response."""

    by_doctor: list[LostTimeItem]
    by_laser: list[LostTimeByLaserItem]
