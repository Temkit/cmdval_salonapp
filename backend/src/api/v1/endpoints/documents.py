"""Document generation, QR code, and temp photo endpoints."""

import io
import os
import time
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse

from src.api.v1.dependencies import CurrentUser, get_patient_service
from src.application.services.patient_service import PatientService
from src.application.services.pdf_service import PDFService
from src.application.services.qr_service import QRService
from src.core.config import get_settings
from src.domain.exceptions import PatientNotFoundError

router = APIRouter(prefix="/documents", tags=["Documents"])
settings = get_settings()

TEMP_PHOTOS_DIR = os.path.join(settings.photos_path, "temp-photos")


def _patient_to_dict(patient) -> dict:
    """Convert a Patient entity to a dict for PDF generation."""
    return {
        "nom": patient.nom,
        "prenom": patient.prenom,
        "code_carte": patient.code_carte,
    }


@router.get("/patients/{patient_id}/documents/consent")
async def get_consent_form(
    patient_id: str,
    _current_user: CurrentUser,
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
):
    """Generate and return the consent form PDF for a patient."""
    try:
        patient = await patient_service.get_patient(patient_id)
    except PatientNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient non trouve",
        )

    pdf_service = PDFService()
    pdf_bytes = pdf_service.generate_consent_form(_patient_to_dict(patient))

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (f'inline; filename="consentement_{patient.code_carte}.pdf"')
        },
    )


@router.get("/patients/{patient_id}/documents/rules")
async def get_clinic_rules(
    patient_id: str,
    _current_user: CurrentUser,
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
):
    """Generate and return the clinic rules PDF for a patient."""
    try:
        patient = await patient_service.get_patient(patient_id)
    except PatientNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient non trouve",
        )

    pdf_service = PDFService()
    pdf_bytes = pdf_service.generate_clinic_rules(_patient_to_dict(patient))

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": (f'inline; filename="reglement_{patient.code_carte}.pdf"')},
    )


@router.get("/patients/{patient_id}/documents/precautions")
async def get_precautions(
    patient_id: str,
    _current_user: CurrentUser,
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
):
    """Generate and return the treatment precautions PDF for a patient."""
    try:
        patient = await patient_service.get_patient(patient_id)
    except PatientNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient non trouve",
        )

    pdf_service = PDFService()
    pdf_bytes = pdf_service.generate_precautions(_patient_to_dict(patient))

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (f'inline; filename="precautions_{patient.code_carte}.pdf"')
        },
    )


@router.get("/patients/{patient_id}/qr-code")
async def get_patient_qr_code(
    patient_id: str,
    _current_user: CurrentUser,
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
):
    """Generate and return a QR code PNG containing the patient's card code."""
    try:
        patient = await patient_service.get_patient(patient_id)
    except PatientNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient non trouve",
        )

    qr_service = QRService()
    qr_bytes = qr_service.generate_qr_code(patient.code_carte)

    return StreamingResponse(
        io.BytesIO(qr_bytes),
        media_type="image/png",
        headers={"Content-Disposition": (f'inline; filename="qr_{patient.code_carte}.png"')},
    )


# --- Temp Photo endpoints ---


def _cleanup_old_temp_photos(max_age_hours: int = 24) -> None:
    """Remove temp photos older than max_age_hours."""
    if not os.path.exists(TEMP_PHOTOS_DIR):
        return
    cutoff = time.time() - (max_age_hours * 3600)
    for filename in os.listdir(TEMP_PHOTOS_DIR):
        filepath = os.path.join(TEMP_PHOTOS_DIR, filename)
        try:
            if os.path.getmtime(filepath) < cutoff:
                os.remove(filepath)
        except OSError:
            pass


@router.post("/temp-photo", status_code=status.HTTP_201_CREATED)
async def upload_temp_photo(
    _current_user: CurrentUser,
    photo: UploadFile = File(...),
):
    """Upload a temporary photo. Returns ID and URL for retrieval."""
    # Cleanup old photos opportunistically
    _cleanup_old_temp_photos()

    os.makedirs(TEMP_PHOTOS_DIR, exist_ok=True)

    photo_id = uuid4().hex
    ext = os.path.splitext(photo.filename or "photo.jpg")[1] or ".jpg"
    filename = f"{photo_id}{ext}"
    filepath = os.path.join(TEMP_PHOTOS_DIR, filename)

    content = await photo.read()
    if len(content) > settings.max_photo_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Photo trop volumineuse (max {settings.max_photo_size_mb}MB)",
        )

    with open(filepath, "wb") as f:
        f.write(content)

    return {
        "id": photo_id,
        "url": f"/api/v1/documents/temp-photo/{photo_id}",
    }


@router.get("/temp-photo/{photo_id}")
async def get_temp_photo(
    photo_id: str,
    _current_user: CurrentUser,
):
    """Serve a temporary photo by ID."""
    if not os.path.exists(TEMP_PHOTOS_DIR):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo non trouvee")

    # Find file matching the ID (any extension)
    for filename in os.listdir(TEMP_PHOTOS_DIR):
        if filename.startswith(photo_id):
            return FileResponse(os.path.join(TEMP_PHOTOS_DIR, filename))

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo non trouvee")


@router.delete("/temp-photo/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_temp_photo(
    photo_id: str,
    _current_user: CurrentUser,
):
    """Delete a temporary photo."""
    if not os.path.exists(TEMP_PHOTOS_DIR):
        return

    for filename in os.listdir(TEMP_PHOTOS_DIR):
        if filename.startswith(photo_id):
            os.remove(os.path.join(TEMP_PHOTOS_DIR, filename))
            return
