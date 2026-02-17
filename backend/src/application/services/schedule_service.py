"""Schedule and waiting queue service."""

import re
import unicodedata
from datetime import date, datetime, time
from io import BytesIO

from src.domain.entities.schedule import DailyScheduleEntry, WaitingQueueEntry
from src.domain.exceptions import NotFoundError, ValidationError
from src.infrastructure.events import event_bus
from src.infrastructure.database.repositories import PatientRepository, UserRepository
from src.infrastructure.database.repositories.box_repository import BoxAssignmentRepository
from src.infrastructure.database.repositories.schedule_repository import (
    ScheduleRepository,
    WaitingQueueRepository,
)


def _normalize_name(s: str) -> str:
    """Normalize a name for comparison (remove accents, lowercase, strip)."""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower().replace("-", " ").replace("'", " ").strip()


def _normalize_phone(phone: str) -> str:
    """Extract digits from a phone number for comparison."""
    return re.sub(r"\D", "", phone.strip())


class ScheduleService:
    """Service for schedule and waiting queue operations."""

    def __init__(
        self,
        schedule_repo: ScheduleRepository,
        queue_repo: WaitingQueueRepository,
        patient_repo: PatientRepository,
        user_repo: UserRepository,
        box_assignment_repo: BoxAssignmentRepository | None = None,
    ):
        self.schedule_repo = schedule_repo
        self.queue_repo = queue_repo
        self.patient_repo = patient_repo
        self.user_repo = user_repo
        self.box_assignment_repo = box_assignment_repo

    async def upload_schedule(
        self, file_data: bytes, uploaded_by: str | None = None
    ) -> dict:
        """Parse Excel file and create schedule entries.

        Returns dict with 'entries', 'phone_matched', 'phone_conflicts'.
        """
        import openpyxl

        wb = openpyxl.load_workbook(BytesIO(file_data), data_only=True)
        ws = wb.active
        if not ws:
            raise ValidationError("Fichier Excel vide")

        entries = []
        phone_matched = 0
        phone_conflicts: list[dict] = []
        skipped_rows = 0
        total_rows = 0

        # Pre-load users for doctor name matching
        all_users = await self.user_repo.find_all()
        doctor_name_map: dict[str, str] = {}
        for u in all_users:
            if u.nom:
                doctor_name_map[_normalize_name(u.nom)] = u.id
                if u.prenom:
                    full = _normalize_name(f"{u.prenom} {u.nom}")
                    doctor_name_map[full] = u.id
                    # Also "Dr. Nom" pattern
                    doctor_name_map[_normalize_name(f"dr {u.nom}")] = u.id
                    doctor_name_map[_normalize_name(f"dr. {u.nom}")] = u.id

        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row or not row[0]:
                continue
            total_rows += 1

            # Parse date
            row_date = row[0]
            if isinstance(row_date, datetime):
                row_date = row_date.date()
            elif isinstance(row_date, str):
                try:
                    row_date = datetime.strptime(row_date, "%d/%m/%Y").date()
                except ValueError:
                    skipped_rows += 1
                    continue

            prenom = str(row[1]).strip() if row[1] else ""
            nom = str(row[2]).strip() if row[2] else ""
            doctor = str(row[3]).strip() if row[3] else ""
            specialite = str(row[4]).strip() if len(row) > 4 and row[4] else None
            duration_type = str(row[5]).strip() if len(row) > 5 and row[5] else None

            # Parse times
            start = row[6] if len(row) > 6 else None
            end = row[7] if len(row) > 7 else None
            note = str(row[8]).strip() if len(row) > 8 and row[8] else None

            # Parse phone (column 9)
            telephone = None
            if len(row) > 9 and row[9]:
                raw_phone = str(row[9]).strip()
                # Handle numeric phone (Excel may parse as float)
                if raw_phone.replace(".", "").replace(",", "").isdigit():
                    raw_phone = raw_phone.split(".")[0]  # Remove .0 from float
                if len(_normalize_phone(raw_phone)) >= 6:
                    telephone = raw_phone

            start_time = self._parse_time(start) or time(9, 0)
            end_time = self._parse_time(end)

            if not nom and not prenom:
                skipped_rows += 1
                continue

            # Resolve doctor_id from name
            doctor_id = None
            if doctor:
                norm_doctor = _normalize_name(doctor)
                doctor_id = doctor_name_map.get(norm_doctor)

            entry = DailyScheduleEntry(
                date=row_date,
                patient_prenom=prenom,
                patient_nom=nom,
                patient_telephone=telephone,
                doctor_name=doctor,
                doctor_id=doctor_id,
                specialite=specialite,
                duration_type=duration_type,
                start_time=start_time,
                end_time=end_time,
                notes=note,
                uploaded_by=uploaded_by,
            )

            # Try to match patient - phone first, then name
            matched_by_phone = False
            if telephone:
                phone_results = await self.patient_repo.find_by_phone(telephone)
                if phone_results:
                    best = phone_results[0]
                    best_nom_norm = _normalize_name(best.nom) if best.nom else ""
                    best_prenom_norm = _normalize_name(best.prenom) if best.prenom else ""
                    nom_norm = _normalize_name(nom)
                    prenom_norm = _normalize_name(prenom)

                    name_matches = (
                        best_nom_norm == nom_norm and best_prenom_norm == prenom_norm
                    )

                    if name_matches:
                        # Phone + name match: confident match
                        entry.patient_id = best.id
                        phone_matched += 1
                        matched_by_phone = True
                    else:
                        # Phone matches but name differs: conflict
                        phone_conflicts.append({
                            "entry_nom": nom,
                            "entry_prenom": prenom,
                            "entry_telephone": telephone,
                            "matched_patient_id": best.id,
                            "matched_patient_nom": best.nom,
                            "matched_patient_prenom": best.prenom,
                            "matched": False,
                        })
                        # Still link the patient (phone is more reliable than name)
                        entry.patient_id = best.id
                        phone_matched += 1
                        matched_by_phone = True

            # Fall back to name matching if phone didn't match
            if not matched_by_phone:
                matched, _ = await self.patient_repo.search(nom, page=1, size=10)
                for p in matched:
                    if p.prenom and p.prenom.lower() == prenom.lower():
                        entry.patient_id = p.id
                        break

            entries.append(entry)

        if not entries:
            raise ValidationError("Aucune entrée valide trouvée dans le fichier")

        # Delete existing entries for the dates being uploaded
        dates = set(e.date for e in entries)
        for d in dates:
            await self.schedule_repo.delete_by_date(d)

        created = await self.schedule_repo.create_batch(entries)
        return {
            "entries": created,
            "phone_matched": phone_matched,
            "phone_conflicts": phone_conflicts,
            "skipped_rows": skipped_rows,
            "total_rows": total_rows,
        }

    async def create_manual_entry(
        self,
        entry_date: date,
        patient_nom: str,
        patient_prenom: str,
        doctor_name: str = "",
        start_time: time = time(9, 0),
        end_time: time | None = None,
        duration_type: str | None = None,
        doctor_id: str | None = None,
        notes: str | None = None,
    ) -> DailyScheduleEntry:
        """Create a manual schedule entry (walk-in patient)."""
        entry = DailyScheduleEntry(
            date=entry_date,
            patient_nom=patient_nom,
            patient_prenom=patient_prenom,
            doctor_name=doctor_name or "Non assigné",
            doctor_id=doctor_id,
            start_time=start_time,
            end_time=end_time,
            duration_type=duration_type,
            notes=notes,
        )

        # Try to match patient by name
        matched, _ = await self.patient_repo.search(patient_nom, page=1, size=10)
        for p in matched:
            if p.prenom and p.prenom.lower() == patient_prenom.lower():
                entry.patient_id = p.id
                break

        created = await self.schedule_repo.create_batch([entry])
        return created[0]

    async def get_schedule(self, target_date: date) -> list[DailyScheduleEntry]:
        return await self.schedule_repo.find_by_date(target_date)

    async def get_today_schedule(self) -> list[DailyScheduleEntry]:
        return await self.schedule_repo.find_by_date(date.today())

    async def check_in(self, entry_id: str) -> WaitingQueueEntry | dict:
        """Check in a patient from the schedule to the waiting queue.

        Returns WaitingQueueEntry on success, or a conflict dict if patient
        matching is ambiguous.
        """
        entry = await self.schedule_repo.find_by_id(entry_id)
        if not entry:
            raise NotFoundError(f"Entrée planning {entry_id} non trouvée")

        if entry.status != "expected":
            raise ValidationError("Patient déjà enregistré ou absent")

        # Resolve patient_id if not already set
        patient_id = entry.patient_id
        if not patient_id:
            # Search for potential matches (include phone from Excel if available)
            candidates = await self._find_patient_candidates(
                entry.patient_nom, entry.patient_prenom, entry.patient_telephone
            )

            if len(candidates) == 1:
                # Exact single match - use it
                patient_id = candidates[0].id
            elif len(candidates) > 1:
                # Multiple potential matches - return conflict for user to resolve
                return {
                    "conflict": True,
                    "schedule_entry_id": entry_id,
                    "patient_nom": entry.patient_nom,
                    "patient_prenom": entry.patient_prenom,
                    "candidates": [
                        {
                            "id": c.id,
                            "nom": c.nom,
                            "prenom": c.prenom,
                            "telephone": c.telephone,
                            "email": c.email,
                            "created_at": c.created_at,
                        }
                        for c in candidates
                    ],
                    "message": "Plusieurs patients correspondent à ce nom",
                }
            # If no candidates, patient_id stays None - will be created on resolve

        # Update schedule status
        await self.schedule_repo.update_status(entry_id, "checked_in")

        # Create queue entry
        queue_entry = WaitingQueueEntry(
            schedule_id=entry_id,
            patient_id=patient_id,
            patient_name=f"{entry.patient_prenom} {entry.patient_nom}",
            doctor_id=entry.doctor_id,
            doctor_name=entry.doctor_name,
        )
        result = await self.queue_repo.create(queue_entry)

        # Publish SSE event for real-time notifications
        event_data = {
            "type": "patient_checked_in",
            "patient_name": f"{entry.patient_prenom} {entry.patient_nom}",
            "doctor_id": entry.doctor_id or "",
            "doctor_name": entry.doctor_name or "",
            "position": result.position,
        }
        await event_bus.publish("queue:all", event_data)
        if entry.doctor_id:
            await event_bus.publish(f"queue:{entry.doctor_id}", event_data)

        return result

    async def _find_patient_candidates(
        self, nom: str, prenom: str, telephone: str | None = None
    ) -> list:
        """Find potential patient matches using phone and/or fuzzy name matching."""
        nom_norm = _normalize_name(nom)
        prenom_norm = _normalize_name(prenom)

        candidates = []
        seen_ids: set[str] = set()

        # 1. Phone-based matching (highest confidence)
        if telephone:
            phone_results = await self.patient_repo.find_by_phone(telephone)
            for p in phone_results:
                if p.id not in seen_ids:
                    candidates.append(p)
                    seen_ids.add(p.id)

        # 2. Name-based matching
        matched, _ = await self.patient_repo.search(nom, page=1, size=50)
        for p in matched:
            if p.id in seen_ids:
                continue
            p_nom_norm = _normalize_name(p.nom) if p.nom else ""
            p_prenom_norm = _normalize_name(p.prenom) if p.prenom else ""

            # Exact match on normalized names
            if p_nom_norm == nom_norm and p_prenom_norm == prenom_norm:
                candidates.append(p)
                seen_ids.add(p.id)
            # Partial match (nom matches, prenom similar)
            elif p_nom_norm == nom_norm and (
                prenom_norm in p_prenom_norm or p_prenom_norm in prenom_norm
            ):
                candidates.append(p)
                seen_ids.add(p.id)

        return candidates

    async def resolve_conflict(
        self,
        schedule_entry_id: str,
        patient_id: str | None = None,
        telephone: str | None = None,
    ) -> WaitingQueueEntry:
        """Resolve a check-in conflict by selecting existing patient or creating new."""
        from src.domain.entities.patient import Patient

        entry = await self.schedule_repo.find_by_id(schedule_entry_id)
        if not entry:
            raise NotFoundError(f"Entrée planning {schedule_entry_id} non trouvée")

        if entry.status != "expected":
            raise ValidationError("Patient déjà enregistré")

        # Either use selected patient or create new
        if patient_id:
            # Verify patient exists
            patient = await self.patient_repo.find_by_id(patient_id)
            if not patient:
                raise NotFoundError(f"Patient {patient_id} non trouvé")
        else:
            # Create new patient
            new_patient = Patient(
                nom=entry.patient_nom,
                prenom=entry.patient_prenom,
                telephone=telephone,
            )
            patient = await self.patient_repo.create(new_patient)
            patient_id = patient.id

        # Update schedule status
        await self.schedule_repo.update_status(schedule_entry_id, "checked_in")

        # Create queue entry
        queue_entry = WaitingQueueEntry(
            schedule_id=schedule_entry_id,
            patient_id=patient_id,
            patient_name=f"{entry.patient_prenom} {entry.patient_nom}",
            doctor_id=entry.doctor_id,
            doctor_name=entry.doctor_name,
        )
        result = await self.queue_repo.create(queue_entry)

        # Publish SSE event
        event_data = {
            "type": "patient_checked_in",
            "patient_name": f"{entry.patient_prenom} {entry.patient_nom}",
            "doctor_id": entry.doctor_id or "",
            "doctor_name": entry.doctor_name or "",
            "position": result.position,
        }
        await event_bus.publish("queue:all", event_data)
        if entry.doctor_id:
            await event_bus.publish(f"queue:{entry.doctor_id}", event_data)

        return result

    async def get_queue(self, doctor_id: str | None = None) -> list[WaitingQueueEntry]:
        return await self.queue_repo.find_active(doctor_id)

    async def get_display_queue(self) -> list[WaitingQueueEntry]:
        return await self.queue_repo.find_display()

    async def call_patient(self, entry_id: str, caller_user_id: str | None = None) -> WaitingQueueEntry:
        result = await self.queue_repo.update_status(entry_id, "in_treatment")
        if not result:
            raise NotFoundError(f"Entrée file d'attente {entry_id} non trouvée")

        # Set box info from the calling doctor's assignment
        if caller_user_id and self.box_assignment_repo:
            assignment = await self.box_assignment_repo.get_by_user(caller_user_id)
            if assignment:
                await self.queue_repo.update_box(entry_id, assignment.box_id, assignment.box_nom)
                result.box_id = assignment.box_id
                result.box_nom = assignment.box_nom

        # Also update schedule
        if result.schedule_id:
            await self.schedule_repo.update_status(result.schedule_id, "in_treatment")
        return result

    async def reassign_patient(self, entry_id: str, doctor_id: str) -> WaitingQueueEntry:
        """Reassign a waiting queue patient to a different doctor."""
        entry = await self.queue_repo.find_by_id(entry_id)
        if not entry:
            raise NotFoundError(f"Entrée file d'attente {entry_id} non trouvée")

        # Resolve doctor name
        doctor = await self.user_repo.find_by_id(doctor_id)
        doctor_name = f"{doctor.prenom} {doctor.nom}" if doctor else ""

        result = await self.queue_repo.update_doctor(entry_id, doctor_id, doctor_name)
        if not result:
            raise NotFoundError(f"Entrée file d'attente {entry_id} non trouvée")
        return result

    async def complete_patient(self, entry_id: str) -> WaitingQueueEntry:
        result = await self.queue_repo.update_status(entry_id, "done")
        if not result:
            raise NotFoundError(f"Entrée file d'attente {entry_id} non trouvée")
        if result.schedule_id:
            await self.schedule_repo.update_status(result.schedule_id, "completed")
        return result

    async def mark_no_show(self, entry_id: str) -> WaitingQueueEntry:
        entry = await self.queue_repo.find_by_id(entry_id)
        if not entry:
            raise NotFoundError(f"Entrée file d'attente {entry_id} non trouvée")
        if entry.status != "waiting":
            raise ValueError("Seuls les patients en attente peuvent être marqués absents")
        result = await self.queue_repo.update_status(entry_id, "no_show")
        if not result:
            raise NotFoundError(f"Entrée file d'attente {entry_id} non trouvée")
        if result.schedule_id:
            await self.schedule_repo.update_status(result.schedule_id, "no_show")
        return result

    async def mark_left(self, entry_id: str) -> WaitingQueueEntry:
        entry = await self.queue_repo.find_by_id(entry_id)
        if not entry:
            raise NotFoundError(f"Entrée file d'attente {entry_id} non trouvée")
        if entry.status != "in_treatment":
            raise ValueError("Seuls les patients en traitement peuvent être marqués partis")
        result = await self.queue_repo.update_status(entry_id, "left")
        if not result:
            raise NotFoundError(f"Entrée file d'attente {entry_id} non trouvée")
        return result

    async def mark_schedule_no_show(self, entry_id: str) -> DailyScheduleEntry:
        """Mark a schedule entry as no-show directly (without check-in first)."""
        entry = await self.schedule_repo.find_by_id(entry_id)
        if not entry:
            raise NotFoundError(f"Entrée planning {entry_id} non trouvée")
        if entry.status != "expected":
            raise ValidationError("Seuls les patients attendus peuvent être marqués absents")
        result = await self.schedule_repo.update_status(entry_id, "no_show")
        if not result:
            raise NotFoundError(f"Entrée planning {entry_id} non trouvée")
        return result

    async def get_absences(self, patient_id: str | None = None) -> list[WaitingQueueEntry]:
        """Get no-show entries, optionally filtered by patient."""
        return await self.queue_repo.find_no_shows(patient_id)

    def _parse_time(self, value) -> time | None:
        if value is None:
            return None
        if isinstance(value, time):
            return value
        if isinstance(value, datetime):
            return value.time()
        if isinstance(value, str):
            for fmt in ["%H:%M", "%H:%M:%S", "%Hh%M"]:
                try:
                    return datetime.strptime(value.strip(), fmt).time()
                except ValueError:
                    continue
        return None
