"""Dashboard endpoints."""

from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.api.v1.dependencies import get_dashboard_service, require_permission
from src.application.services import DashboardService
from src.schemas.dashboard import (
    DashboardStatsResponse,
    PeriodStatsResponse,
    PraticienStatsItem,
    PraticienStatsResponse,
    RecentActivityItem,
    RecentActivityResponse,
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
    return ZoneStatsResponse(
        zones=[ZoneStatsItem(**item) for item in data]
    )


@router.get("/sessions/by-praticien", response_model=PraticienStatsResponse)
async def get_sessions_by_praticien(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
):
    """Get session count by praticien."""
    data = await dashboard_service.get_sessions_by_praticien()
    return PraticienStatsResponse(
        praticiens=[PraticienStatsItem(**item) for item in data]
    )


@router.get("/sessions/by-period", response_model=PeriodStatsResponse)
async def get_sessions_by_period(
    _: Annotated[dict, Depends(require_permission("dashboard.view"))],
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
    date_from: datetime = Query(
        default_factory=lambda: datetime.utcnow() - timedelta(days=30)
    ),
    date_to: datetime = Query(default_factory=datetime.utcnow),
    group_by: str = Query("day", regex="^(day|week|month)$"),
):
    """Get session count by time period."""
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
    return RecentActivityResponse(
        activities=[RecentActivityItem(**item) for item in data]
    )
