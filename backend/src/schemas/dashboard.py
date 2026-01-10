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
