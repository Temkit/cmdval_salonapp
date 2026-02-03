"""Schedule and waiting queue schemas."""

import datetime as dt

from src.schemas.base import AppBaseModel


class ScheduleEntryResponse(AppBaseModel):
    id: str
    date: dt.date
    patient_nom: str
    patient_prenom: str
    patient_id: str | None = None
    doctor_name: str
    doctor_id: str | None = None
    specialite: str | None = None
    duration_type: str | None = None
    start_time: dt.time
    end_time: dt.time | None = None
    notes: str | None = None
    status: str
    created_at: dt.datetime


class ScheduleListResponse(AppBaseModel):
    entries: list[ScheduleEntryResponse]
    date: dt.date
    total: int


class ScheduleUploadResponse(AppBaseModel):
    message: str
    entries_created: int
    date: dt.date | None = None


class QueueEntryResponse(AppBaseModel):
    id: str
    schedule_id: str | None = None
    patient_id: str | None = None
    patient_name: str
    doctor_id: str | None = None
    doctor_name: str
    box_id: str | None = None
    box_nom: str | None = None
    checked_in_at: dt.datetime
    position: int
    status: str
    called_at: dt.datetime | None = None
    completed_at: dt.datetime | None = None


class QueueListResponse(AppBaseModel):
    entries: list[QueueEntryResponse]
    total: int


class QueueDisplayResponse(AppBaseModel):
    """Public display response (minimal info)."""

    entries: list[QueueEntryResponse]
