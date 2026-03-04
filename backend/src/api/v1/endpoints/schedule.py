"""Schedule and waiting queue endpoints."""

import asyncio
import csv
import io
import json
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from src.api.v1.dependencies import CurrentUser, get_schedule_service, require_permission
from src.application.services.schedule_service import ScheduleService
from src.domain.exceptions import NotFoundError
from src.infrastructure.events import event_bus
from src.schemas.schedule import (
    AbsenceListResponse,
    AbsenceRecordResponse,
    CheckInConflictResponse,
    ManualScheduleEntryCreate,
    PhoneConflict,
    QueueDisplayResponse,
    QueueEntryResponse,
    QueueListResponse,
    ResolveConflictRequest,
    ScheduleEntryResponse,
    ScheduleEntryUpdate,
    ScheduleListResponse,
    ScheduleUploadResponse,
)

router = APIRouter(prefix="/schedule", tags=["schedule"])


def _schedule_response(e, zone_warnings: list[str] | None = None) -> ScheduleEntryResponse:
    return ScheduleEntryResponse(
        id=e.id,
        date=e.date,
        patient_nom=e.patient_nom,
        patient_prenom=e.patient_prenom,
        patient_id=e.patient_id,
        patient_telephone=e.patient_telephone,
        doctor_name=e.doctor_name,
        doctor_id=e.doctor_id,
        specialite=e.specialite,
        duration_type=e.duration_type,
        start_time=e.start_time,
        end_time=e.end_time,
        notes=e.notes,
        zone_ids=e.zone_ids or [],
        status=e.status,
        created_at=e.created_at,
        zone_warnings=zone_warnings or [],
    )


def _queue_response(
    e,
    zone_names: list[str] | None = None,
    patient_code_carte: str | None = None,
    patient_telephone: str | None = None,
) -> QueueEntryResponse:
    return QueueEntryResponse(
        id=e.id,
        schedule_id=e.schedule_id,
        patient_id=e.patient_id,
        patient_name=e.patient_name,
        doctor_id=e.doctor_id,
        doctor_name=e.doctor_name,
        box_id=e.box_id,
        box_nom=e.box_nom,
        checked_in_at=e.checked_in_at,
        position=e.position,
        status=e.status,
        called_at=e.called_at,
        completed_at=e.completed_at,
        zone_names=zone_names or [],
        patient_code_carte=patient_code_carte,
        patient_telephone=patient_telephone,
    )


@router.post("/upload", response_model=ScheduleUploadResponse)
async def upload_schedule(
    current_user: Annotated[dict, Depends(require_permission("schedule.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
    file: UploadFile = File(...),
):
    """Upload daily schedule Excel file."""
    content = await file.read()
    result = await schedule_service.upload_schedule(content, uploaded_by=current_user.get("id"))
    entries = result["entries"]
    phone_conflicts = result.get("phone_conflicts", [])
    target_date = entries[0].date if entries else None
    patients_created = result.get("patients_created", 0)
    return ScheduleUploadResponse(
        message=f"{len(entries)} entrées créées",
        entries_created=len(entries),
        date=target_date,
        phone_matched=result.get("phone_matched", 0),
        phone_conflicts=[PhoneConflict(**c) for c in phone_conflicts],
        skipped_rows=result.get("skipped_rows", 0),
        total_rows=result.get("total_rows", 0),
        patients_created=patients_created,
    )


@router.get("/today", response_model=ScheduleListResponse)
async def get_today_schedule(
    current_user: Annotated[dict, Depends(require_permission("schedule.view"))],
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
    current_user: Annotated[dict, Depends(require_permission("queue.view"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
    doctor_id: str | None = None,
):
    # Practitioners can only see their own queue
    if current_user.get("role") == "Praticien":
        doctor_id = current_user["id"]
    entries = await schedule_service.get_queue(doctor_id)
    enriched = await schedule_service.enrich_queue_entries(entries)
    return QueueListResponse(
        entries=[
            _queue_response(
                item["entry"],
                zone_names=item.get("zone_names"),
                patient_code_carte=item.get("patient_code_carte"),
                patient_telephone=item.get("patient_telephone"),
            )
            for item in enriched
        ],
        total=len(entries),
    )


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
    current_user: Annotated[dict, Depends(require_permission("queue.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entry = await schedule_service.call_patient(entry_id, caller_user_id=current_user.get("id"))
    return _queue_response(entry)


@router.put("/queue/{entry_id}/complete", response_model=QueueEntryResponse, tags=["queue"])
async def complete_patient(
    entry_id: str,
    current_user: Annotated[dict, Depends(require_permission("queue.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entry = await schedule_service.complete_patient(entry_id)
    return _queue_response(entry)


@router.put("/queue/{entry_id}/no-show", response_model=QueueEntryResponse, tags=["queue"])
async def mark_no_show(
    entry_id: str,
    current_user: Annotated[dict, Depends(require_permission("queue.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entry = await schedule_service.mark_no_show(entry_id)
    return _queue_response(entry)


@router.put("/queue/{entry_id}/left", response_model=QueueEntryResponse, tags=["queue"])
async def mark_left(
    entry_id: str,
    current_user: Annotated[dict, Depends(require_permission("queue.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entry = await schedule_service.mark_left(entry_id)
    return _queue_response(entry)


@router.get("/queue/events", tags=["queue"])
async def queue_events(
    doctor_id: str | None = Query(None, min_length=36, max_length=36),
):
    """SSE endpoint for real-time queue notifications."""
    channel = f"queue:{doctor_id}" if doctor_id else "queue:all"
    queue = event_bus.subscribe(channel)

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {
                        "event": event.get("type", "message"),
                        "data": json.dumps(event),
                    }
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield {"event": "ping", "data": ""}
        except asyncio.CancelledError:
            pass
        finally:
            event_bus.unsubscribe(channel, queue)

    return EventSourceResponse(event_generator())


@router.post("/manual", response_model=ScheduleEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_entry(
    request: ManualScheduleEntryCreate,
    current_user: Annotated[dict, Depends(require_permission("schedule.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    """Create a manual schedule entry (walk-in patient)."""
    entry = await schedule_service.create_manual_entry(
        entry_date=request.date,
        patient_nom=request.patient_nom,
        patient_prenom=request.patient_prenom,
        patient_id=request.patient_id,
        doctor_name=request.doctor_name or "",
        doctor_id=request.doctor_id,
        start_time=request.start_time,
        end_time=request.end_time,
        duration_type=request.duration_type,
        zone_ids=request.zone_ids if request.zone_ids else None,
        notes=request.notes,
    )
    zone_warnings = getattr(entry, "_zone_warnings", [])
    return _schedule_response(entry, zone_warnings=zone_warnings)


@router.put("/queue/{entry_id}/reassign", response_model=QueueEntryResponse, tags=["queue"])
async def reassign_patient(
    entry_id: str,
    current_user: Annotated[dict, Depends(require_permission("queue.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
    doctor_id: str = Query(..., description="New doctor ID"),
):
    """Reassign a waiting queue patient to a different doctor."""
    try:
        entry = await schedule_service.reassign_patient(entry_id, doctor_id)
        return _queue_response(entry)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/absences", response_model=AbsenceListResponse, tags=["absences"])
async def get_absences(
    current_user: Annotated[dict, Depends(require_permission("schedule.view"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
    patient_id: str | None = Query(None, description="Filtrer par patient"),
):
    """Get no-show/absence records (from both queue and schedule)."""
    records = await schedule_service.get_absences(patient_id)
    absences = [
        AbsenceRecordResponse(
            id=r["id"],
            patient_id=r.get("patient_id"),
            patient_name=r["patient_name"],
            date=r["date"],
            schedule_id=r.get("schedule_id"),
            doctor_name=r["doctor_name"],
            created_at=r["created_at"],
        )
        for r in records
    ]
    return AbsenceListResponse(absences=absences, total=len(absences))


@router.get("/export")
async def export_schedule_csv(
    current_user: Annotated[dict, Depends(require_permission("schedule.view"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
    target_date: date | None = None,
):
    """Export schedule entries as CSV."""
    from_date = target_date or date.today()
    entries = await schedule_service.get_schedule(from_date)
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Date", "Heure", "Patient", "Medecin", "Duree", "Zones", "Statut", "Notes"])
    for e in entries:
        writer.writerow([
            e.date.strftime("%d/%m/%Y") if e.date else "",
            e.start_time.strftime("%H:%M") if e.start_time else "",
            f"{e.patient_prenom} {e.patient_nom}".strip(),
            e.doctor_name or "",
            e.duration_type or "",
            ", ".join(e.zone_ids) if e.zone_ids else "",
            e.status or "",
            e.notes or "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agenda_export.csv"},
    )


@router.get("/absences/export")
async def export_absences_csv(
    current_user: Annotated[dict, Depends(require_permission("schedule.view"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    """Export absence records as CSV."""
    records = await schedule_service.get_absences()
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Date", "Patient", "Medecin"])
    for r in records:
        writer.writerow([
            r["date"].strftime("%d/%m/%Y") if hasattr(r["date"], "strftime") else str(r["date"]),
            r["patient_name"],
            r["doctor_name"] or "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=absences_export.csv"},
    )


@router.put("/{entry_id}", response_model=ScheduleEntryResponse)
async def update_schedule_entry(
    entry_id: str,
    data: ScheduleEntryUpdate,
    current_user: Annotated[dict, Depends(require_permission("schedule.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    """Update a schedule entry (doctor, zones, duration, times)."""
    try:
        entry = await schedule_service.update_schedule_entry(
            entry_id=entry_id,
            doctor_id=data.doctor_id,
            doctor_name=data.doctor_name,
            zone_ids=data.zone_ids,
            duration_type=data.duration_type,
            start_time=data.start_time,
            end_time=data.end_time,
            notes=data.notes,
        )
        return _schedule_response(entry)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule_entry(
    entry_id: str,
    current_user: Annotated[dict, Depends(require_permission("schedule.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    """Delete a schedule entry."""
    try:
        await schedule_service.delete_schedule_entry(entry_id)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{entry_id}/no-show", response_model=ScheduleEntryResponse)
async def mark_schedule_no_show(
    entry_id: str,
    current_user: Annotated[dict, Depends(require_permission("schedule.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    """Mark a schedule entry as no-show directly (without check-in)."""
    try:
        entry = await schedule_service.mark_schedule_no_show(entry_id)
        return _schedule_response(entry)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


# Dynamic path route MUST be last
@router.get("/{target_date}", response_model=ScheduleListResponse)
async def get_schedule(
    target_date: date,
    current_user: Annotated[dict, Depends(require_permission("schedule.view"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    entries = await schedule_service.get_schedule(target_date)
    return ScheduleListResponse(
        entries=[_schedule_response(e) for e in entries],
        date=target_date,
        total=len(entries),
    )


@router.post("/{entry_id}/check-in", response_model=QueueEntryResponse | CheckInConflictResponse)
async def check_in_patient(
    entry_id: str,
    current_user: Annotated[dict, Depends(require_permission("schedule.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    result = await schedule_service.check_in(entry_id)
    # If conflict detected, return conflict response
    if isinstance(result, dict) and result.get("conflict"):
        return CheckInConflictResponse(**result)
    return _queue_response(result)


@router.post("/resolve-conflict", response_model=QueueEntryResponse)
async def resolve_check_in_conflict(
    request: ResolveConflictRequest,
    current_user: Annotated[dict, Depends(require_permission("schedule.manage"))],
    schedule_service: Annotated[ScheduleService, Depends(get_schedule_service)],
):
    """Resolve a check-in conflict by selecting existing patient or creating new."""
    entry = await schedule_service.resolve_conflict(
        schedule_entry_id=request.schedule_entry_id,
        patient_id=request.patient_id,
        telephone=request.telephone,
    )
    return _queue_response(entry)
