"""Session service."""

import os
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from src.core.config import get_settings
from src.domain.entities.session import LASER_TYPES, Session, SessionPhoto
from src.domain.exceptions import (
    PatientNotFoundError,
    SessionNotFoundError,
    UserNotFoundError,
    ZoneNotFoundError,
)
from src.infrastructure.database.repositories import (
    PatientRepository,
    PatientZoneRepository,
    SessionRepository,
    UserRepository,
)


class SessionService:
    """Service for session operations."""

    def __init__(
        self,
        session_repository: SessionRepository,
        patient_repository: PatientRepository,
        patient_zone_repository: PatientZoneRepository,
        user_repository: UserRepository,
    ):
        self.session_repository = session_repository
        self.patient_repository = patient_repository
        self.patient_zone_repository = patient_zone_repository
        self.user_repository = user_repository
        self.settings = get_settings()

    async def create_session(
        self,
        patient_id: str,
        patient_zone_id: str,
        praticien_id: str,
        type_laser: str,
        parametres: dict[str, Any],
        spot_size: int | None = None,
        fluence: float | None = None,
        pulse_duration_ms: int | None = None,
        frequency_hz: float | None = None,
        notes: str | None = None,
        duree_minutes: int | None = None,
        date_seance: datetime | None = None,
        photo_files: list[tuple[str, bytes]] | None = None,
    ) -> Session:
        """Create a new session."""
        # Verify patient exists
        patient = await self.patient_repository.find_by_id(patient_id)
        if not patient:
            raise PatientNotFoundError(patient_id)

        # Verify patient zone exists and belongs to patient
        patient_zone = await self.patient_zone_repository.find_by_id(patient_zone_id)
        if not patient_zone:
            raise ZoneNotFoundError(patient_zone_id)
        if patient_zone.patient_id != patient_id:
            raise ZoneNotFoundError(patient_zone_id)

        # Verify praticien exists
        praticien = await self.user_repository.find_by_id(praticien_id)
        if not praticien:
            raise UserNotFoundError(praticien_id)

        # Create session
        session = Session(
            patient_id=patient_id,
            patient_zone_id=patient_zone_id,
            praticien_id=praticien_id,
            type_laser=type_laser,
            parametres=parametres,
            spot_size=spot_size,
            fluence=fluence,
            pulse_duration_ms=pulse_duration_ms,
            frequency_hz=frequency_hz,
            zone_nom=patient_zone.zone_nom,
            praticien_nom=f"{praticien.prenom} {praticien.nom}",
            notes=notes,
            duree_minutes=duree_minutes,
            date_seance=date_seance or datetime.now(UTC).replace(tzinfo=None),
        )

        # Handle photo uploads
        if photo_files:
            for filename, file_data in photo_files:
                photo = await self._save_photo(session.id, filename, file_data)
                session.photos.append(photo)

        # Save session
        created_session = await self.session_repository.create(session)

        # Increment session count on patient zone
        await self.patient_zone_repository.increment_seances(patient_zone_id)

        return created_session

    async def get_session(self, session_id: str) -> Session:
        """Get session by ID."""
        session = await self.session_repository.find_by_id(session_id)
        if not session:
            raise SessionNotFoundError(session_id)
        return session

    async def get_patient_sessions(
        self,
        patient_id: str,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Session], int]:
        """Get sessions for a patient."""
        patient = await self.patient_repository.find_by_id(patient_id)
        if not patient:
            raise PatientNotFoundError(patient_id)
        return await self.session_repository.find_by_patient(patient_id, page, size)

    async def get_all_sessions(
        self,
        page: int = 1,
        size: int = 20,
        praticien_id: str | None = None,
        zone_id: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[Session], int]:
        """Get all sessions with filters."""
        return await self.session_repository.find_all(
            page=page,
            size=size,
            praticien_id=praticien_id,
            zone_id=zone_id,
            date_from=date_from,
            date_to=date_to,
        )

    async def update_session_notes(
        self,
        session_id: str,
        notes: str,
    ) -> Session:
        """Update notes on an existing session."""
        session = await self.session_repository.find_by_id(session_id)
        if not session:
            raise SessionNotFoundError(session_id)
        await self.session_repository.update_notes(session_id, notes)
        return await self.session_repository.find_by_id(session_id)  # type: ignore

    async def add_photo_to_session(
        self,
        session_id: str,
        filename: str,
        file_data: bytes,
    ) -> SessionPhoto:
        """Add a photo to an existing session."""
        session = await self.session_repository.find_by_id(session_id)
        if not session:
            raise SessionNotFoundError(session_id)

        return await self._save_photo(session_id, filename, file_data)

    async def get_last_session_params(
        self,
        patient_id: str,
        patient_zone_id: str,
    ) -> dict | None:
        """Get parameters from the last session for a patient+zone."""
        session = await self.session_repository.find_last_by_patient_zone(
            patient_id, patient_zone_id
        )
        if not session:
            return None
        return {
            "type_laser": session.type_laser,
            "spot_size": str(session.spot_size) if session.spot_size else None,
            "fluence": str(session.fluence) if session.fluence else None,
            "pulse_duration_ms": str(session.pulse_duration_ms) if session.pulse_duration_ms else None,
            "frequency_hz": str(session.frequency_hz) if session.frequency_hz else None,
            "session_date": session.date_seance.isoformat() if session.date_seance else None,
        }

    async def get_laser_types(self) -> list[str]:
        """Get available laser types."""
        return LASER_TYPES

    async def _save_photo(
        self,
        session_id: str,
        filename: str,
        file_data: bytes,
    ) -> SessionPhoto:
        """Save a photo file and create record."""
        # Create directory structure
        photo_dir = os.path.join(self.settings.photos_path, session_id)
        os.makedirs(photo_dir, exist_ok=True)

        # Generate unique filename
        ext = os.path.splitext(filename)[1] or ".jpg"
        unique_filename = f"{uuid4().hex}{ext}"
        filepath = os.path.join(photo_dir, unique_filename)

        # Save file
        with open(filepath, "wb") as f:
            f.write(file_data)

        # Create photo record
        photo = await self.session_repository.add_photo(
            session_id=session_id,
            filename=filename,
            filepath=filepath,
        )

        return photo

    def get_photo_url(self, photo: SessionPhoto) -> str:
        """Get URL for a photo."""
        # Return relative path for API serving
        return f"/api/v1/photos/{photo.session_id}/{os.path.basename(photo.filepath)}"
