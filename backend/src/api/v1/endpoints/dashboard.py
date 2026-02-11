"""Dashboard endpoints."""

import csv
import io
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from src.api.v1.dependencies import get_dashboard_service, require_permission
from src.application.services import DashboardService
from src.schemas.dashboard import (
    DashboardStatsResponse,
    DemographicsResponse,
    DoctorPerformanceResponse,
    LostTimeStatsResponse,
    PeriodStatsResponse,
    PraticienStatsItem,
    PraticienStatsResponse,
    RecentActivityItem,
    RecentActivityResponse,
    RevenueStatsResponse,
    SideEffectStatsResponse,
    ZoneStatsItem,
    ZoneStatsResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Tableau de bord"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
):
    """Get dashboard statistics."""
    stats = await dashboard_service.get_stats()
    return DashboardStatsResponse(**stats)


@router.get("/sessions/by-zone", response_model=ZoneStatsResponse)
async def get_sessions_by_zone(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
):
    """Get session count by zone."""
    data = await dashboard_service.get_sessions_by_zone()
    return ZoneStatsResponse(zones=[ZoneStatsItem(**item) for item in data])


@router.get("/sessions/by-praticien", response_model=PraticienStatsResponse)
async def get_sessions_by_praticien(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
):
    """Get session count by praticien."""
    data = await dashboard_service.get_sessions_by_praticien()
    return PraticienStatsResponse(praticiens=[PraticienStatsItem(**item) for item in data])


@router.get("/sessions/by-period", response_model=PeriodStatsResponse)
async def get_sessions_by_period(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
    date_from: datetime = Query(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None) - timedelta(days=30)),
    date_to: datetime = Query(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None)),
    group_by: str = Query("day", pattern="^(day|week|month)$"),
):
    """Get session count by time period."""
    if date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date_from doit être antérieure à date_to",
        )
    data = await dashboard_service.get_sessions_by_period(
        date_from=date_from,
        date_to=date_to,
        group_by=group_by,
    )
    return PeriodStatsResponse(
        data=[{"period": item["period"], "count": item["count"]} for item in data],
        group_by=group_by,
    )


@router.get("/recent-activity", response_model=RecentActivityResponse)
async def get_recent_activity(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
    limit: int = Query(10, ge=1, le=50),
):
    """Get recent activity."""
    data = await dashboard_service.get_recent_activity(limit=limit)
    return RecentActivityResponse(activities=[RecentActivityItem(**item) for item in data])


@router.get("/side-effects", response_model=SideEffectStatsResponse)
async def get_side_effect_stats(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
):
    """Get side effect statistics by severity and monthly trend."""
    data = await dashboard_service.get_side_effect_stats()
    return SideEffectStatsResponse(**data)


@router.get("/doctor-performance", response_model=DoctorPerformanceResponse)
async def get_doctor_performance(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
):
    """Get doctor performance metrics (average session duration)."""
    data = await dashboard_service.get_doctor_performance()
    return DoctorPerformanceResponse(**data)


@router.get("/revenue", response_model=RevenueStatsResponse)
async def get_revenue_stats(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
):
    """Get revenue statistics with optional date range filter."""
    data = await dashboard_service.get_revenue_stats(date_from=date_from, date_to=date_to)
    return RevenueStatsResponse(**data)


@router.get("/lost-time", response_model=LostTimeStatsResponse)
async def get_lost_time_stats(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
):
    """Get lost/overtime statistics per doctor and per laser type."""
    data = await dashboard_service.get_lost_time_stats(date_from=date_from, date_to=date_to)
    return LostTimeStatsResponse(**data)


@router.get("/demographics", response_model=DemographicsResponse)
async def get_demographics(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
):
    """Get patient demographics (age and city distribution)."""
    data = await dashboard_service.get_demographics()
    return DemographicsResponse(**data)


@router.get("/export")
async def export_sessions_csv(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
):
    """Export session data as CSV."""
    data = await dashboard_service.export_sessions(
        date_from=date_from,
        date_to=date_to,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Date", "Patient", "Zone", "Praticien", "Type Laser",
        "Duree (min)", "Notes",
    ])
    for row in data:
        writer.writerow([
            row.get("date_seance", ""),
            row.get("patient_name", ""),
            row.get("zone_nom", ""),
            row.get("praticien_nom", ""),
            row.get("type_laser", ""),
            row.get("duree_minutes", ""),
            row.get("notes", ""),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sessions_export.csv"},
    )
