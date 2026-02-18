"""Patient management endpoints."""

import csv
import io
import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from src.api.v1.dependencies import (
    get_patient_service,
    get_patient_zone_service,
    require_permission,
)
from src.application.services import PatientService, PatientZoneService
from src.domain.entities.patient import Patient
from src.domain.exceptions import (
    DuplicateCardCodeError,
    DuplicateZoneError,
    PatientNotFoundError,
    ZoneNotFoundError,
)
from src.schemas.base import MessageResponse
from src.schemas.patient import (
    PatientCreate,
    PatientDetailResponse,
    PatientListResponse,
    PatientResponse,
    PatientUpdate,
)
from src.schemas.zone import (
    PatientZoneCreate,
    PatientZoneListResponse,
    PatientZoneResponse,
    PatientZoneUpdate,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


def _patient_response(p: "Patient") -> PatientResponse:
    """Build PatientResponse from Patient entity."""
    return PatientResponse(
        id=p.id,
        code_carte=p.code_carte,
        nom=p.nom,
        prenom=p.prenom,
        date_naissance=p.date_naissance,
        sexe=p.sexe,
        telephone=p.telephone,
        email=p.email,
        adresse=p.adresse,
        commune=p.commune,
        wilaya=p.wilaya,
        notes=p.notes,
        phototype=p.phototype,
        status=p.status,
        age=p.age,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("", response_model=PatientListResponse)
async def list_patients(
    _: Annotated[dict, Depends(require_permission("patients.view"))],
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, max_length=100, description="Recherche par nom, téléphone ou code carte"),
    doctor_id: str | None = Query(None, description="Filtrer par médecin (patients traités)"),
):
    """List patients with optional search."""
    if doctor_id:
        patients, total = await patient_service.get_doctor_patients(doctor_id, page, size, q)
    elif q:
        patients, total = await patient_service.search_patients(q, page, size)
    else:
        patients, total = await patient_service.get_all_patients(page, size)

    return PatientListResponse(
        patients=[_patient_response(p) for p in patients],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get("/export")
async def export_patients_csv(
    _: Annotated[dict, Depends(require_permission("patients.view"))],
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
    q: str | None = Query(None, max_length=100),
):
    """Export patients as CSV."""
    if q:
        patients, _ = await patient_service.search_patients(q, page=1, size=10000)
    else:
        patients, _ = await patient_service.get_all_patients(page=1, size=10000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Code Carte", "Nom", "Prenom", "Date Naissance", "Sexe",
        "Telephone", "Email", "Wilaya", "Commune", "Phototype",
        "Statut", "Date Creation",
    ])
    for p in patients:
        writer.writerow([
            p.code_carte or "",
            p.nom or "",
            p.prenom or "",
            p.date_naissance or "",
            p.sexe or "",
            p.telephone or "",
            p.email or "",
            p.wilaya or "",
            p.commune or "",
            p.phototype or "",
            p.status or "",
            str(p.created_at) if p.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=patients_export.csv"},
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    request: PatientCreate,
    _: Annotated[dict, Depends(require_permission("patients.create"))],
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
):
    """
    Create a new patient for pre-consultation evaluation.

    In the patient-first workflow:
    1. Create patient (minimal info: name, phone) with status "en_attente_evaluation"
    2. Create pre-consultation for the patient
    3. Doctor validates or rejects the pre-consultation
    4. Patient status is updated to "actif" or "ineligible"
    """
    try:
        patient = await patient_service.create_patient(
            nom=request.nom,
            prenom=request.prenom,
            code_carte=request.code_carte,
            date_naissance=request.date_naissance,
            sexe=request.sexe,
            telephone=request.telephone,
            email=request.email,
            adresse=request.adresse,
            commune=request.commune,
            wilaya=request.wilaya,
            notes=request.notes,
            phototype=request.phototype,
            status=request.status,
        )
        return _patient_response(patient)
    except DuplicateCardCodeError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.get("/by-card/{code}", response_model=PatientResponse)
async def get_patient_by_card(
    code: str,
    _: Annotated[dict, Depends(require_permission("patients.view"))],
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
):
    """Get patient by card code (barcode scan)."""
    try:
        patient = await patient_service.get_patient_by_card(code)
        return _patient_response(patient)
    except PatientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/{patient_id}", response_model=PatientDetailResponse)
async def get_patient(
    patient_id: str,
    _: Annotated[dict, Depends(require_permission("patients.view"))],
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
    patient_zone_service: Annotated[PatientZoneService, Depends(get_patient_zone_service)],
):
    """Get patient details with zones."""
    try:
        patient = await patient_service.get_patient(patient_id)
        zones = await patient_zone_service.get_patient_zones(patient_id)

        return PatientDetailResponse(
            **_patient_response(patient).model_dump(),
            zones=[PatientZoneResponse.from_entity(z) for z in zones],
        )
    except PatientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    request: PatientUpdate,
    _: Annotated[dict, Depends(require_permission("patients.edit"))],
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
):
    """Update patient."""
    try:
        patient = await patient_service.update_patient(
            patient_id=patient_id,
            nom=request.nom,
            prenom=request.prenom,
            date_naissance=request.date_naissance,
            sexe=request.sexe,
            telephone=request.telephone,
            email=request.email,
            adresse=request.adresse,
            commune=request.commune,
            wilaya=request.wilaya,
            notes=request.notes,
            phototype=request.phototype,
            status=request.status,
        )
        return _patient_response(patient)
    except PatientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/{patient_id}", response_model=MessageResponse)
async def delete_patient(
    patient_id: str,
    _: Annotated[dict, Depends(require_permission("patients.delete"))],
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
):
    """Delete patient."""
    try:
        await patient_service.delete_patient(patient_id)
        return MessageResponse(message="Patient supprimé")
    except PatientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


# Patient zones
@router.get("/{patient_id}/zones", response_model=PatientZoneListResponse)
async def list_patient_zones(
    patient_id: str,
    _: Annotated[dict, Depends(require_permission("patients.view"))],
    patient_zone_service: Annotated[PatientZoneService, Depends(get_patient_zone_service)],
):
    """List patient zones."""
    try:
        zones = await patient_zone_service.get_patient_zones(patient_id)
        return PatientZoneListResponse(zones=[PatientZoneResponse.from_entity(z) for z in zones])
    except PatientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/{patient_id}/zones",
    response_model=PatientZoneResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_patient_zone(
    patient_id: str,
    request: PatientZoneCreate,
    _: Annotated[dict, Depends(require_permission("zones.manage"))],
    patient_zone_service: Annotated[PatientZoneService, Depends(get_patient_zone_service)],
):
    """Add a zone to patient."""
    try:
        zone = await patient_zone_service.add_zone_to_patient(
            patient_id=patient_id,
            zone_definition_id=request.zone_definition_id,
            seances_prevues=request.seances_prevues,
            notes=request.notes,
        )
        return PatientZoneResponse.from_entity(zone)
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
    except DuplicateZoneError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.put("/{patient_id}/zones/{zone_id}", response_model=PatientZoneResponse)
async def update_patient_zone(
    patient_id: str,
    zone_id: str,
    request: PatientZoneUpdate,
    _: Annotated[dict, Depends(require_permission("zones.manage"))],
    patient_zone_service: Annotated[PatientZoneService, Depends(get_patient_zone_service)],
):
    """Update patient zone."""
    try:
        zone = await patient_zone_service.update_patient_zone(
            zone_id=zone_id,
            seances_prevues=request.seances_prevues,
            notes=request.notes,
        )
        return PatientZoneResponse.from_entity(zone)
    except ZoneNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/{patient_id}/zones/{zone_id}", response_model=MessageResponse)
async def delete_patient_zone(
    patient_id: str,
    zone_id: str,
    _: Annotated[dict, Depends(require_permission("zones.manage"))],
    patient_zone_service: Annotated[PatientZoneService, Depends(get_patient_zone_service)],
):
    """Delete patient zone."""
    try:
        await patient_zone_service.delete_patient_zone(zone_id)
        return MessageResponse(message="Zone supprimée")
    except ZoneNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


# Note: Questionnaire endpoints moved to pre-consultations
# Questionnaire is now part of the pre-consultation workflow, not patient records
