"""Session management endpoints."""

import json
import math
import os
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse

from src.api.v1.dependencies import (
    CurrentUser,
    get_patient_service,
    get_session_service,
    require_permission,
)
from src.application.services import PatientService, SessionService
from src.core.config import get_settings
from src.domain.exceptions import (
    PatientNotFoundError,
    SessionNotFoundError,
    UserNotFoundError,
    ZoneNotFoundError,
)
from src.schemas.session import (
    LaserTypeResponse,
    SessionDetailResponse,
    SessionListResponse,
    SessionPhotoResponse,
    SessionResponse,
)

router = APIRouter(tags=["Séances"])
settings = get_settings()


@router.get("/patients/{patient_id}/sessions", response_model=SessionListResponse)
async def list_patient_sessions(
    patient_id: str,
    _: Annotated[dict, Depends(require_permission("sessions.view"))],
    session_service: Annotated[SessionService, Depends(get_session_service)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    """List sessions for a patient."""
    try:
        sessions, total = await session_service.get_patient_sessions(
            patient_id=patient_id,
            page=page,
            size=size,
        )
        return SessionListResponse(
            sessions=[
                SessionResponse(
                    id=s.id,
                    patient_id=s.patient_id,
                    patient_zone_id=s.patient_zone_id,
                    zone_nom=s.zone_nom,
                    praticien_id=s.praticien_id,
                    praticien_nom=s.praticien_nom,
                    date_seance=s.date_seance,
                    type_laser=s.type_laser,
                    parametres=s.parametres,
                    notes=s.notes,
                    duree_minutes=s.duree_minutes,
                    photos=[
                        SessionPhotoResponse(
                            id=p.id,
                            filename=p.filename,
                            url=session_service.get_photo_url(p),
                            created_at=p.created_at,
                        )
                        for p in s.photos
                    ],
                    created_at=s.created_at,
                )
                for s in sessions
            ],
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total > 0 else 0,
        )
    except PatientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/patients/{patient_id}/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    patient_id: str,
    current_user: CurrentUser,
    _: Annotated[dict, Depends(require_permission("sessions.create"))],
    session_service: Annotated[SessionService, Depends(get_session_service)],
    patient_zone_id: str = Form(...),
    type_laser: str = Form(...),
    parametres: str = Form("{}"),  # JSON string
    notes: str | None = Form(None),
    duree_minutes: int | None = Form(None),
    date_seance: datetime | None = Form(None),
    photo_ids: str | None = Form(None),  # JSON array of temp photo IDs
    photos: list[UploadFile] = File(default=[]),
):
    """Create a new session."""
    try:
        # Parse parameters JSON
        params = json.loads(parametres)

        # Read photo files from uploads or temp photo IDs
        photo_files = []

        # Handle temp photo IDs (already uploaded)
        if photo_ids:
            temp_ids = json.loads(photo_ids)
            temp_dir = os.path.join(settings.photos_path, "temp-photos")
            for temp_id in temp_ids:
                if os.path.exists(temp_dir):
                    for fname in os.listdir(temp_dir):
                        if fname.startswith(temp_id):
                            fpath = os.path.join(temp_dir, fname)
                            with open(fpath, "rb") as f:
                                photo_files.append((fname, f.read()))
                            os.remove(fpath)  # Clean up temp file
                            break

        # Handle direct photo uploads (legacy)
        for photo in photos:
            if photo.filename:
                content = await photo.read()
                photo_files.append((photo.filename, content))

        session = await session_service.create_session(
            patient_id=patient_id,
            patient_zone_id=patient_zone_id,
            praticien_id=current_user["id"],
            type_laser=type_laser,
            parametres=params,
            notes=notes,
            duree_minutes=duree_minutes,
            date_seance=date_seance,
            photo_files=photo_files if photo_files else None,
        )

        return SessionResponse(
            id=session.id,
            patient_id=session.patient_id,
            patient_zone_id=session.patient_zone_id,
            zone_nom=session.zone_nom,
            praticien_id=session.praticien_id,
            praticien_nom=session.praticien_nom,
            date_seance=session.date_seance,
            type_laser=session.type_laser,
            parametres=session.parametres,
            notes=session.notes,
            duree_minutes=session.duree_minutes,
            photos=[
                SessionPhotoResponse(
                    id=p.id,
                    filename=p.filename,
                    url=session_service.get_photo_url(p),
                    created_at=p.created_at,
                )
                for p in session.photos
            ],
            created_at=session.created_at,
        )
    except PatientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ZoneNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paramètres JSON invalides",
        )


@router.get("/sessions/last-params")
async def get_last_session_params(
    _: Annotated[dict, Depends(require_permission("sessions.view"))],
    session_service: Annotated[SessionService, Depends(get_session_service)],
    patient_id: str = Query(...),
    patient_zone_id: str = Query(...),
):
    """Get parameters from the last session for a patient+zone."""
    params = await session_service.get_last_session_params(patient_id, patient_zone_id)
    if not params:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune seance precedente trouvee",
        )
    return params


@router.get("/sessions/laser-types", response_model=LaserTypeResponse)
async def get_laser_types(
    _: Annotated[dict, Depends(require_permission("sessions.view"))],
    session_service: Annotated[SessionService, Depends(get_session_service)],
):
    """Get available laser types."""
    types = await session_service.get_laser_types()
    return LaserTypeResponse(types=types)


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: str,
    _: Annotated[dict, Depends(require_permission("sessions.view"))],
    session_service: Annotated[SessionService, Depends(get_session_service)],
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
):
    """Get session details."""
    try:
        session = await session_service.get_session(session_id)
        patient = await patient_service.get_patient(session.patient_id)

        return SessionDetailResponse(
            id=session.id,
            patient_id=session.patient_id,
            patient_zone_id=session.patient_zone_id,
            zone_nom=session.zone_nom,
            praticien_id=session.praticien_id,
            praticien_nom=session.praticien_nom,
            date_seance=session.date_seance,
            type_laser=session.type_laser,
            parametres=session.parametres,
            notes=session.notes,
            duree_minutes=session.duree_minutes,
            photos=[
                SessionPhotoResponse(
                    id=p.id,
                    filename=p.filename,
                    url=session_service.get_photo_url(p),
                    created_at=p.created_at,
                )
                for p in session.photos
            ],
            created_at=session.created_at,
            patient_nom=patient.nom,
            patient_prenom=patient.prenom,
            patient_code_carte=patient.code_carte,
        )
    except SessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except PatientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/photos/{session_id}/{filename}")
async def get_photo(
    session_id: str,
    filename: str,
    _: Annotated[dict, Depends(require_permission("sessions.view"))],
):
    """Serve a session photo."""
    filepath = os.path.join(settings.photos_path, session_id, filename)
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo non trouvée",
        )
    return FileResponse(filepath)
