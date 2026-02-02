"""Pre-consultation management endpoints."""

import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.v1.dependencies import (
    CurrentUser,
    get_pre_consultation_service,
    get_questionnaire_service,
    require_permission,
)
from src.application.services.pre_consultation_service import PreConsultationService
from src.application.services.question_service import QuestionnaireService
from src.domain.exceptions import NotFoundError, ValidationError
from src.schemas.base import MessageResponse
from src.schemas.patient import PatientResponse
from src.schemas.pre_consultation import (
    PreConsultationCreate,
    PreConsultationCreatePatientRequest,
    PreConsultationListResponse,
    PreConsultationPaginatedResponse,
    PreConsultationRejectRequest,
    PreConsultationResponse,
    PreConsultationUpdate,
    PreConsultationZoneCreate,
    PreConsultationZoneResponse,
    PreConsultationZoneUpdate,
)
from src.schemas.questionnaire import (
    PreConsultationQuestionnaireResponse,
    PreConsultationQuestionnaireUpdate,
)

router = APIRouter(prefix="/pre-consultations", tags=["Pre-consultations"])


@router.get("", response_model=PreConsultationPaginatedResponse)
async def list_pre_consultations(
    _: Annotated[dict, Depends(require_permission("pre_consultations.view"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
):
    """List pre-consultations with pagination and filters."""
    pre_consultations, total = await pre_consultation_service.list(
        page=page,
        size=size,
        status=status_filter,
        search=search,
    )

    return PreConsultationPaginatedResponse(
        items=[
            PreConsultationListResponse(
                id=pc.id,
                patient_id=pc.patient_id,
                patient_nom=pc.patient_nom,
                patient_prenom=pc.patient_prenom,
                patient_code_carte=pc.patient_code_carte,
                sexe=pc.sexe,
                age=pc.age,
                phototype=pc.phototype,
                status=pc.status,
                has_contraindications=pc.has_contraindications,
                zones_count=len(pc.zones),
                eligible_zones_count=len([z for z in pc.zones if z.is_eligible]),
                created_by_name=pc.created_by_name,
                created_at=pc.created_at,
                updated_at=pc.updated_at,
            )
            for pc in pre_consultations
        ],
        total=total,
        page=page,
        page_size=size,
        total_pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.post("", response_model=PreConsultationResponse, status_code=status.HTTP_201_CREATED)
async def create_pre_consultation(
    request: PreConsultationCreate,
    current_user: CurrentUser,
    _: Annotated[dict, Depends(require_permission("pre_consultations.create"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Create a new pre-consultation for an existing patient."""
    try:
        pre_consultation = await pre_consultation_service.create(
            patient_id=request.patient_id,
            sexe=request.sexe,
            age=request.age,
            created_by=current_user["id"],
            statut_marital=request.statut_marital,
            is_pregnant=request.is_pregnant,
            is_breastfeeding=request.is_breastfeeding,
            pregnancy_planning=request.pregnancy_planning,
            has_previous_laser=request.has_previous_laser,
            previous_laser_clarity_ii=request.previous_laser_clarity_ii,
            previous_laser_sessions=request.previous_laser_sessions,
            previous_laser_brand=request.previous_laser_brand,
            hair_removal_methods=request.hair_removal_methods,
            medical_history=request.medical_history,
            dermatological_conditions=request.dermatological_conditions,
            has_current_treatments=request.has_current_treatments,
            current_treatments_details=request.current_treatments_details,
            recent_peeling=request.recent_peeling,
            recent_peeling_date=request.recent_peeling_date,
            phototype=request.phototype,
            notes=request.notes,
            zones=[z.model_dump() for z in request.zones],
        )

        return _to_response(pre_consultation)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/{pre_consultation_id}", response_model=PreConsultationResponse)
async def get_pre_consultation(
    pre_consultation_id: str,
    _: Annotated[dict, Depends(require_permission("pre_consultations.view"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Get pre-consultation details."""
    try:
        pre_consultation = await pre_consultation_service.get_by_id(pre_consultation_id)
        return _to_response(pre_consultation)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{pre_consultation_id}", response_model=PreConsultationResponse)
async def update_pre_consultation(
    pre_consultation_id: str,
    request: PreConsultationUpdate,
    _: Annotated[dict, Depends(require_permission("pre_consultations.edit"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Update pre-consultation (only in draft status)."""
    try:
        # Filter out None values for partial update
        update_data = {k: v for k, v in request.model_dump().items() if v is not None}
        pre_consultation = await pre_consultation_service.update(pre_consultation_id, **update_data)
        return _to_response(pre_consultation)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{pre_consultation_id}", response_model=MessageResponse)
async def delete_pre_consultation(
    pre_consultation_id: str,
    _: Annotated[dict, Depends(require_permission("pre_consultations.delete"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Delete pre-consultation (only in draft/rejected status)."""
    try:
        await pre_consultation_service.delete(pre_consultation_id)
        return MessageResponse(message="Pre-consultation supprimee")
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# Zone endpoints
@router.post(
    "/{pre_consultation_id}/zones",
    response_model=PreConsultationZoneResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_zone(
    pre_consultation_id: str,
    request: PreConsultationZoneCreate,
    _: Annotated[dict, Depends(require_permission("pre_consultations.edit"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Add zone eligibility to pre-consultation."""
    try:
        zone = await pre_consultation_service.add_zone(
            pre_consultation_id=pre_consultation_id,
            zone_id=request.zone_id,
            is_eligible=request.is_eligible,
            observations=request.observations,
        )
        return PreConsultationZoneResponse(
            id=zone.id,
            zone_id=zone.zone_id,
            is_eligible=zone.is_eligible,
            observations=zone.observations,
            zone_nom=zone.zone_nom,
            created_at=zone.created_at,
            updated_at=zone.updated_at,
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/{pre_consultation_id}/zones/{zone_id}",
    response_model=PreConsultationZoneResponse,
)
async def update_zone(
    pre_consultation_id: str,
    zone_id: str,
    request: PreConsultationZoneUpdate,
    _: Annotated[dict, Depends(require_permission("pre_consultations.edit"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Update zone eligibility."""
    try:
        zone = await pre_consultation_service.update_zone(
            pre_consultation_id=pre_consultation_id,
            zone_id=zone_id,
            is_eligible=request.is_eligible if request.is_eligible is not None else True,
            observations=request.observations,
        )
        return PreConsultationZoneResponse(
            id=zone.id,
            zone_id=zone.zone_id,
            is_eligible=zone.is_eligible,
            observations=zone.observations,
            zone_nom=zone.zone_nom,
            created_at=zone.created_at,
            updated_at=zone.updated_at,
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{pre_consultation_id}/zones/{zone_id}", response_model=MessageResponse)
async def delete_zone(
    pre_consultation_id: str,
    zone_id: str,
    _: Annotated[dict, Depends(require_permission("pre_consultations.edit"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Delete zone eligibility."""
    try:
        await pre_consultation_service.delete_zone(pre_consultation_id, zone_id)
        return MessageResponse(message="Zone supprimee")
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# Workflow endpoints
@router.post("/{pre_consultation_id}/submit", response_model=PreConsultationResponse)
async def submit_pre_consultation(
    pre_consultation_id: str,
    _: Annotated[dict, Depends(require_permission("pre_consultations.edit"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Submit pre-consultation for validation."""
    try:
        pre_consultation = await pre_consultation_service.submit(pre_consultation_id)
        return _to_response(pre_consultation)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{pre_consultation_id}/validate", response_model=PreConsultationResponse)
async def validate_pre_consultation(
    pre_consultation_id: str,
    current_user: CurrentUser,
    _: Annotated[dict, Depends(require_permission("pre_consultations.validate"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Validate pre-consultation (doctor action)."""
    try:
        pre_consultation = await pre_consultation_service.validate(
            pre_consultation_id, validated_by=current_user["id"]
        )
        return _to_response(pre_consultation)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{pre_consultation_id}/reject", response_model=PreConsultationResponse)
async def reject_pre_consultation(
    pre_consultation_id: str,
    request: PreConsultationRejectRequest,
    current_user: CurrentUser,
    _: Annotated[dict, Depends(require_permission("pre_consultations.validate"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Reject pre-consultation (doctor action)."""
    try:
        pre_consultation = await pre_consultation_service.reject(
            pre_consultation_id,
            reason=request.reason,
            rejected_by=current_user["id"],
        )
        return _to_response(pre_consultation)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{pre_consultation_id}/create-patient", response_model=PatientResponse)
async def create_patient_from_pre_consultation(
    pre_consultation_id: str,
    request: PreConsultationCreatePatientRequest,
    current_user: CurrentUser,
    _: Annotated[dict, Depends(require_permission("patients.edit"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Create patient from validated pre-consultation."""
    try:
        patient = await pre_consultation_service.create_patient(
            pre_consultation_id=pre_consultation_id,
            nom=request.nom,
            prenom=request.prenom,
            created_by=current_user["id"],
            date_naissance=request.date_naissance,
            telephone=request.telephone,
            email=request.email,
            adresse=request.adresse,
            ville=request.ville,
            code_postal=request.code_postal,
            zone_ids=request.zone_ids,
            seances_per_zone=request.seances_per_zone,
        )
        return PatientResponse(
            id=patient.id,
            code_carte=patient.code_carte,
            nom=patient.nom,
            prenom=patient.prenom,
            date_naissance=patient.date_naissance,
            sexe=patient.sexe,
            telephone=patient.telephone,
            email=patient.email,
            adresse=patient.adresse,
            notes=patient.notes,
            phototype=patient.phototype,
            age=patient.age,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# Statistics endpoint
@router.get("/stats/pending-count")
async def get_pending_count(
    _: Annotated[dict, Depends(require_permission("pre_consultations.view"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Get count of pending pre-consultations."""
    count = await pre_consultation_service.count_by_status("pending_validation")
    return {"count": count}


# Get pre-consultation by patient ID
@router.get("/by-patient/{patient_id}", response_model=PreConsultationResponse)
async def get_pre_consultation_by_patient(
    patient_id: str,
    _: Annotated[dict, Depends(require_permission("pre_consultations.view"))],
    pre_consultation_service: Annotated[
        PreConsultationService, Depends(get_pre_consultation_service)
    ],
):
    """Get pre-consultation for a patient."""
    pre_consultation = await pre_consultation_service.get_by_patient_id(patient_id)
    if not pre_consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pre-consultation not found for this patient",
        )
    return _to_response(pre_consultation)


def _to_response(pre_consultation) -> PreConsultationResponse:
    """Convert entity to response schema."""
    return PreConsultationResponse(
        id=pre_consultation.id,
        sexe=pre_consultation.sexe,
        age=pre_consultation.age,
        statut_marital=pre_consultation.statut_marital,
        is_pregnant=pre_consultation.is_pregnant,
        is_breastfeeding=pre_consultation.is_breastfeeding,
        pregnancy_planning=pre_consultation.pregnancy_planning,
        has_previous_laser=pre_consultation.has_previous_laser,
        previous_laser_clarity_ii=pre_consultation.previous_laser_clarity_ii,
        previous_laser_sessions=pre_consultation.previous_laser_sessions,
        previous_laser_brand=pre_consultation.previous_laser_brand,
        hair_removal_methods=pre_consultation.hair_removal_methods,
        medical_history=pre_consultation.medical_history,
        dermatological_conditions=pre_consultation.dermatological_conditions,
        has_current_treatments=pre_consultation.has_current_treatments,
        current_treatments_details=pre_consultation.current_treatments_details,
        recent_peeling=pre_consultation.recent_peeling,
        recent_peeling_date=pre_consultation.recent_peeling_date,
        phototype=pre_consultation.phototype,
        notes=pre_consultation.notes,
        status=pre_consultation.status,
        patient_id=pre_consultation.patient_id,
        patient_nom=pre_consultation.patient_nom,
        patient_prenom=pre_consultation.patient_prenom,
        patient_code_carte=pre_consultation.patient_code_carte,
        patient_telephone=pre_consultation.patient_telephone,
        zones=[
            PreConsultationZoneResponse(
                id=z.id,
                zone_id=z.zone_id,
                is_eligible=z.is_eligible,
                observations=z.observations,
                zone_nom=z.zone_nom,
                created_at=z.created_at,
                updated_at=z.updated_at,
            )
            for z in pre_consultation.zones
        ],
        has_contraindications=pre_consultation.has_contraindications,
        created_by=pre_consultation.created_by,
        created_by_name=pre_consultation.created_by_name,
        validated_by=pre_consultation.validated_by,
        validated_by_name=pre_consultation.validated_by_name,
        validated_at=pre_consultation.validated_at,
        rejection_reason=pre_consultation.rejection_reason,
        created_at=pre_consultation.created_at,
        updated_at=pre_consultation.updated_at,
    )


# Questionnaire endpoints
@router.get(
    "/{pre_consultation_id}/questionnaire", response_model=PreConsultationQuestionnaireResponse
)
async def get_pre_consultation_questionnaire(
    pre_consultation_id: str,
    _: Annotated[dict, Depends(require_permission("pre_consultations.view"))],
    questionnaire_service: Annotated[QuestionnaireService, Depends(get_questionnaire_service)],
):
    """Get pre-consultation questionnaire with responses."""
    try:
        result = await questionnaire_service.get_pre_consultation_questionnaire(pre_consultation_id)
        return PreConsultationQuestionnaireResponse(**result)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put(
    "/{pre_consultation_id}/questionnaire", response_model=PreConsultationQuestionnaireResponse
)
async def update_pre_consultation_questionnaire(
    pre_consultation_id: str,
    request: PreConsultationQuestionnaireUpdate,
    _: Annotated[dict, Depends(require_permission("pre_consultations.edit"))],
    questionnaire_service: Annotated[QuestionnaireService, Depends(get_questionnaire_service)],
):
    """Update pre-consultation questionnaire responses."""
    try:
        result = await questionnaire_service.update_pre_consultation_questionnaire(
            pre_consultation_id=pre_consultation_id,
            responses=[r.model_dump() for r in request.responses],
        )
        return PreConsultationQuestionnaireResponse(**result)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
