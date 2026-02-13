"""Document generation, QR code, temp photo, and patient document endpoints."""

import io
import os
import time
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from src.api.v1.dependencies import CurrentUser, DbSession, get_patient_service
from src.application.services.patient_service import PatientService
from src.application.services.pdf_service import PDFService
from src.application.services.qr_service import QRService
from src.core.config import get_settings
from src.application.services.pdf_service import DEFAULT_TEMPLATES
from src.domain.exceptions import PatientNotFoundError
from src.infrastructure.database.models import DocumentTemplateModel, PatientDocumentModel

router = APIRouter(prefix="/documents", tags=["Documents"])
settings = get_settings()

TEMP_PHOTOS_DIR = os.path.join(settings.photos_path, "temp-photos")
PATIENT_DOCS_DIR = os.path.join(settings.photos_path, "patient-documents")

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/pdf",
}


def _patient_to_dict(patient) -> dict:
    """Convert a Patient entity to a dict for PDF generation."""
    return {
        "nom": patient.nom,
        "prenom": patient.prenom,
        "code_carte": patient.code_carte,
    }


async def _get_template_content(db: AsyncSession, document_type: str) -> dict | None:
    """Load custom template from DB, or return None for defaults."""
    result = await db.execute(
        select(DocumentTemplateModel).where(
            DocumentTemplateModel.document_type == document_type
        )
    )
    tpl = result.scalar_one_or_none()
    return tpl.content if tpl else None


@router.get("/patients/{patient_id}/documents/consent")
async def get_consent_form(
    patient_id: str,
    _current_user: CurrentUser,
    db: DbSession,
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

    template_content = await _get_template_content(db, "consent")
    pdf_service = PDFService()
    pdf_bytes = pdf_service.generate_consent_form(_patient_to_dict(patient), template_content)

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
    db: DbSession,
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

    template_content = await _get_template_content(db, "rules")
    pdf_service = PDFService()
    pdf_bytes = pdf_service.generate_clinic_rules(_patient_to_dict(patient), template_content)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": (f'inline; filename="reglement_{patient.code_carte}.pdf"')},
    )


@router.get("/patients/{patient_id}/documents/precautions")
async def get_precautions(
    patient_id: str,
    _current_user: CurrentUser,
    db: DbSession,
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

    template_content = await _get_template_content(db, "precautions")
    pdf_service = PDFService()
    pdf_bytes = pdf_service.generate_precautions(_patient_to_dict(patient), template_content)

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


# --- Document Template CRUD ---

DOCUMENT_TYPE_LABELS = {
    "consent": "Formulaire de Consentement",
    "rules": "Reglement Interieur",
    "precautions": "Precautions Traitement",
}


class TemplateUpdateRequest(BaseModel):
    content: dict


@router.get("/templates")
async def list_templates(
    _current_user: CurrentUser,
    db: DbSession,
):
    """List all document templates with customization status."""
    result = await db.execute(select(DocumentTemplateModel))
    db_templates = {t.document_type: t for t in result.scalars().all()}

    templates = []
    for doc_type, default_content in DEFAULT_TEMPLATES.items():
        db_tpl = db_templates.get(doc_type)
        templates.append(
            {
                "document_type": doc_type,
                "label": DOCUMENT_TYPE_LABELS.get(doc_type, doc_type),
                "content": db_tpl.content if db_tpl else default_content,
                "is_customized": db_tpl is not None,
                "updated_at": db_tpl.updated_at.isoformat() if db_tpl else None,
            }
        )
    return {"templates": templates}


@router.get("/templates/{document_type}")
async def get_template(
    document_type: str,
    _current_user: CurrentUser,
    db: DbSession,
):
    """Get a single document template content."""
    if document_type not in DEFAULT_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de document inconnu",
        )

    result = await db.execute(
        select(DocumentTemplateModel).where(
            DocumentTemplateModel.document_type == document_type
        )
    )
    db_tpl = result.scalar_one_or_none()

    return {
        "document_type": document_type,
        "label": DOCUMENT_TYPE_LABELS.get(document_type, document_type),
        "content": db_tpl.content if db_tpl else DEFAULT_TEMPLATES[document_type],
        "default_content": DEFAULT_TEMPLATES[document_type],
        "is_customized": db_tpl is not None,
        "updated_at": db_tpl.updated_at.isoformat() if db_tpl else None,
    }


@router.put("/templates/{document_type}")
async def update_template(
    document_type: str,
    body: TemplateUpdateRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update or create a custom document template."""
    if document_type not in DEFAULT_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de document inconnu",
        )

    result = await db.execute(
        select(DocumentTemplateModel).where(
            DocumentTemplateModel.document_type == document_type
        )
    )
    db_tpl = result.scalar_one_or_none()

    if db_tpl:
        db_tpl.content = body.content
        db_tpl.updated_by = current_user.get("id")
    else:
        db_tpl = DocumentTemplateModel(
            document_type=document_type,
            content=body.content,
            updated_by=current_user.get("id"),
        )
        db.add(db_tpl)

    await db.commit()
    await db.refresh(db_tpl)

    return {
        "document_type": document_type,
        "label": DOCUMENT_TYPE_LABELS.get(document_type, document_type),
        "content": db_tpl.content,
        "is_customized": True,
        "updated_at": db_tpl.updated_at.isoformat(),
    }


@router.delete("/templates/{document_type}", status_code=status.HTTP_204_NO_CONTENT)
async def reset_template(
    document_type: str,
    _current_user: CurrentUser,
    db: DbSession,
):
    """Reset a document template to defaults by deleting the custom version."""
    if document_type not in DEFAULT_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de document inconnu",
        )

    result = await db.execute(
        select(DocumentTemplateModel).where(
            DocumentTemplateModel.document_type == document_type
        )
    )
    db_tpl = result.scalar_one_or_none()
    if db_tpl:
        await db.delete(db_tpl)
        await db.commit()


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


# --- Patient document uploads (photos/scans of old passage sheets) ---


@router.post("/patients/{patient_id}/uploads", status_code=status.HTTP_201_CREATED)
async def upload_patient_document(
    patient_id: str,
    _current_user: CurrentUser,
    db: DbSession,
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
    file: UploadFile = File(...),
    description: str | None = Form(None),
):
    """Upload a document (photo/scan) to a patient profile."""
    try:
        await patient_service.get_patient(patient_id)
    except PatientNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient non trouve")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type de fichier non autorise. Types acceptes: JPEG, PNG, WebP, HEIC, PDF",
        )

    content = await file.read()
    if len(content) > settings.max_photo_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Fichier trop volumineux (max {settings.max_photo_size_mb}MB)",
        )

    # Store file on disk
    patient_dir = os.path.join(PATIENT_DOCS_DIR, patient_id)
    os.makedirs(patient_dir, exist_ok=True)

    doc_id = str(uuid4())
    ext = os.path.splitext(file.filename or "file")[1] or ".bin"
    stored_filename = f"{doc_id}{ext}"
    filepath = os.path.join(patient_dir, stored_filename)

    with open(filepath, "wb") as f:
        f.write(content)

    # Save metadata to DB
    doc = PatientDocumentModel(
        id=doc_id,
        patient_id=patient_id,
        filename=file.filename or stored_filename,
        filepath=filepath,
        content_type=content_type,
        size_bytes=len(content),
        description=description,
    )
    db.add(doc)
    await db.commit()

    return {
        "id": doc.id,
        "filename": doc.filename,
        "content_type": doc.content_type,
        "size_bytes": doc.size_bytes,
        "description": doc.description,
        "url": f"/api/v1/documents/uploads/{doc.id}/file",
        "created_at": doc.created_at.isoformat(),
    }


@router.get("/patients/{patient_id}/uploads")
async def list_patient_documents(
    patient_id: str,
    _current_user: CurrentUser,
    db: DbSession,
):
    """List all uploaded documents for a patient."""
    result = await db.execute(
        select(PatientDocumentModel)
        .where(PatientDocumentModel.patient_id == patient_id)
        .order_by(PatientDocumentModel.created_at.desc())
    )
    docs = result.scalars().all()
    return {
        "documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "content_type": d.content_type,
                "size_bytes": d.size_bytes,
                "description": d.description,
                "url": f"/api/v1/documents/uploads/{d.id}/file",
                "created_at": d.created_at.isoformat(),
            }
            for d in docs
        ],
        "total": len(docs),
    }


@router.get("/uploads/{doc_id}/file")
async def serve_patient_document(
    doc_id: str,
    _current_user: CurrentUser,
    db: DbSession,
):
    """Serve an uploaded patient document file."""
    result = await db.execute(
        select(PatientDocumentModel).where(PatientDocumentModel.id == doc_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document non trouve")

    if not os.path.exists(doc.filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier non trouve")

    return FileResponse(
        doc.filepath,
        media_type=doc.content_type,
        filename=doc.filename,
    )


@router.delete("/uploads/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient_document(
    doc_id: str,
    _current_user: CurrentUser,
    db: DbSession,
):
    """Delete an uploaded patient document."""
    result = await db.execute(
        select(PatientDocumentModel).where(PatientDocumentModel.id == doc_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document non trouve")

    # Remove file from disk
    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)

    await db.delete(doc)
    await db.commit()
