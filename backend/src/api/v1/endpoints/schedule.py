"""Schedule and waiting queue endpoints."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from src.api.v1.dependencies import CurrentUser, get_schedule_service
from src.application.services.schedule_service import ScheduleService
from src.schemas.schedule import (
    QueueDisplayResponse,
    QueueEntryResponse,
    QueueListResponse,
    ScheduleEntryResponse,
    ScheduleListResponse,
    ScheduleUploadResponse,
)

router = APIRouter(prefix="/schedule", tags=["schedule"])


def _schedule_response(e) -> ScheduleEntryResponse:
    return ScheduleEntryResponse(
        id=e.id,
        date=e.date,
        patient_nom=e.patient_nom,
        patient_prenom=e.patient_prenom,
        patient_id=e.patient_id,
        doctor_name=e.doctor_name,
        doctor_id=e.doctor_id,
        specialite=e.specialite,
        duration_type=e.duration_type,
        start_time=e.start_time,
        end_time=e.end_time,
        notes=e.notes,
        status=e.status,
        created_at=e.created_at,
    )


def _queue_response(e) -> QueueEntryResponse:
    return QueueEntryResponse(
        id=e.id,
        schedule_id=e.schedule_id,
        patient_id=e.patient_id,
        patient_name=e.patient_name,
        doctor_id=e.doctor_id,
        doctor_name=e.doctor_name,
        checked_in_at=e.checked_in_at,
        position=e.position,
        status=e.status,
        called_at=e.called_at,
        completed_at=e.completed_at,
    )


@router.post("/upload", response_model=ScheduleUploadResponse)
async def upload_schedule(
    current_user: CurrentUser,
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
    file: UploadFile = File(...),
):
    """Upload daily schedule Excel file."""
    content = await file.read()
    entries = await schedule_service.upload_schedule(content, uploaded_by=current_user.get("id"))
    target_date = entries[0].date if entries else None
    return ScheduleUploadResponse(
        message=f"{len(entries)} entrées créées", entries_created=len(entries), date=target_date
    )


@router.get("/today", response_model=ScheduleListResponse)
async def get_today_schedule(
    current_user: CurrentUser,
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entries = await schedule_service.get_today_schedule()
    return ScheduleListResponse(
        entries=[_schedule_response(e) for e in entries],
        date=date.today(),
        total=len(entries),
    )


# Queue routes MUST be before /{target_date} to avoid path conflict
@router.get("/queue", response_model=QueueListResponse, tags=["queue"])
async def get_queue(
    current_user: CurrentUser,
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
    doctor_id: str | None = None,
):
    entries = await schedule_service.get_queue(doctor_id)
    return QueueListResponse(entries=[_queue_response(e) for e in entries], total=len(entries))


@router.get("/queue/display", response_model=QueueDisplayResponse, tags=["queue"])
async def get_display_queue(
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    """Public display queue (no auth required)."""
    entries = await schedule_service.get_display_queue()
    return QueueDisplayResponse(entries=[_queue_response(e) for e in entries])


@router.put("/queue/{entry_id}/call", response_model=QueueEntryResponse, tags=["queue"])
async def call_patient(
    entry_id: str,
    current_user: CurrentUser,
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entry = await schedule_service.call_patient(entry_id)
    return _queue_response(entry)


@router.put("/queue/{entry_id}/complete", response_model=QueueEntryResponse, tags=["queue"])
async def complete_patient(
    entry_id: str,
    current_user: CurrentUser,
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entry = await schedule_service.complete_patient(entry_id)
    return _queue_response(entry)


# Dynamic path route MUST be last
@router.get("/{target_date}", response_model=ScheduleListResponse)
async def get_schedule(
    target_date: date,
    current_user: CurrentUser,
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entries = await schedule_service.get_schedule(target_date)
    return ScheduleListResponse(
        entries=[_schedule_response(e) for e in entries],
        date=target_date,
        total=len(entries),
    )


@router.post("/{entry_id}/check-in", response_model=QueueEntryResponse)
async def check_in_patient(
    entry_id: str,
    current_user: CurrentUser,
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entry = await schedule_service.check_in(entry_id)
    return _queue_response(entry)
