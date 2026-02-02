"""Schedule and waiting queue domain entities."""

from dataclasses import dataclass, field
from datetime import date, datetime, time
from uuid import uuid4

SCHEDULE_STATUSES = ["expected", "checked_in", "in_treatment", "completed", "no_show"]
QUEUE_STATUSES = ["waiting", "in_treatment", "done"]


@dataclass
class DailyScheduleEntry:
    """Daily schedule entry parsed from Excel upload."""

    date: date
    patient_nom: str
    patient_prenom: str
    doctor_name: str
    start_time: time
    patient_id: str | None = None
    doctor_id: str | None = None
    specialite: str | None = None
    duration_type: str | None = None
    end_time: time | None = None
    notes: str | None = None
    status: str = "expected"
    uploaded_by: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class WaitingQueueEntry:
    """Entry in the virtual waiting queue."""

    patient_name: str
    doctor_name: str
    schedule_id: str | None = None
    patient_id: str | None = None
    doctor_id: str | None = None
    checked_in_at: datetime = field(default_factory=datetime.utcnow)
    position: int = 0
    status: str = "waiting"
    called_at: datetime | None = None
    completed_at: datetime | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
