"""Schedule and waiting queue schemas."""

import datetime as dt

from pydantic import Field

from src.schemas.base import AppBaseModel


class ManualScheduleEntryCreate(AppBaseModel):
    """Schema for creating a manual schedule entry (walk-in)."""

    date: dt.date
    patient_nom: str = Field(min_length=1)
    patient_prenom: str = Field(min_length=1)
    patient_id: str | None = None
    doctor_id: str | None = None
    doctor_name: str | None = None
    start_time: dt.time
    end_time: dt.time | None = None
    duration_type: str | None = None
    zone_ids: list[str] = Field(default_factory=list)
    notes: str | None = None


class ScheduleEntryResponse(AppBaseModel):
    id: str
    date: dt.date
    patient_nom: str
    patient_prenom: str
    patient_id: str | None = None
    patient_telephone: str | None = None
    doctor_name: str
    doctor_id: str | None = None
    specialite: str | None = None
    duration_type: str | None = None
    start_time: dt.time
    end_time: dt.time | None = None
    notes: str | None = None
    status: str
    created_at: dt.datetime
    zone_warnings: list[str] = []


class ScheduleListResponse(AppBaseModel):
    entries: list[ScheduleEntryResponse]
    date: dt.date
    total: int


class PhoneConflict(AppBaseModel):
    """A phone-based match where the name differs."""

    entry_nom: str
    entry_prenom: str
    entry_telephone: str
    matched_patient_id: str
    matched_patient_nom: str
    matched_patient_prenom: str
    matched: bool = False  # True if user auto-matched despite name difference


class ScheduleUploadResponse(AppBaseModel):
    message: str
    entries_created: int
    date: dt.date | None = None
    phone_matched: int = 0
    phone_conflicts: list[PhoneConflict] = []
    skipped_rows: int = 0
    total_rows: int = 0
    patients_created: int = 0


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
    zone_names: list[str] = []
    patient_code_carte: str | None = None
    patient_telephone: str | None = None


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


class AbsenceRecordResponse(AppBaseModel):
    """Response for a no-show/absence record."""

    id: str
    patient_id: str | None = None
    patient_name: str
    date: dt.date
    schedule_id: str | None = None
    doctor_name: str
    created_at: dt.datetime


class AbsenceListResponse(AppBaseModel):
    """List of absence records."""

    absences: list[AbsenceRecordResponse]
    total: int


class ResolveConflictRequest(AppBaseModel):
    """Request to resolve a check-in conflict."""

    schedule_entry_id: str
    patient_id: str | None = None  # None = create new patient
    # Optional fields for new patient creation
    telephone: str | None = None
