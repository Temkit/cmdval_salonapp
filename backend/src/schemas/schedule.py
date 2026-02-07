"""Schedule and waiting queue schemas."""

import datetime as dt

from pydantic import Field

from src.schemas.base import AppBaseModel


class ManualScheduleEntryCreate(AppBaseModel):
    """Schema for creating a manual schedule entry (walk-in)."""

    date: dt.date
    patient_nom: str = Field(min_length=1)
    patient_prenom: str = Field(min_length=1)
    doctor_name: str = Field(min_length=1)
    start_time: dt.time
    end_time: dt.time | None = None
    duration_type: str | None = None
    notes: str | None = None


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


class PatientCandidate(AppBaseModel):
    """A potential patient match for conflict resolution."""

    id: str
    nom: str
    prenom: str
    telephone: str | None = None
    email: str | None = None
    created_at: dt.datetime


class CheckInConflictResponse(AppBaseModel):
    """Response when check-in finds potential patient matches."""

    conflict: bool = True
    schedule_entry_id: str
    patient_nom: str
    patient_prenom: str
    candidates: list[PatientCandidate]
    message: str = "Patient potentiellement existant"


class ResolveConflictRequest(AppBaseModel):
    """Request to resolve a check-in conflict."""

    schedule_entry_id: str
    patient_id: str | None = None  # None = create new patient
    # Optional fields for new patient creation
    telephone: str | None = None
