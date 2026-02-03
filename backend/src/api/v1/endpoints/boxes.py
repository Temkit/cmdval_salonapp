"""Box (treatment room) endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.v1.dependencies import CurrentUser, get_box_service, require_permission
from src.application.services.box_service import BoxService
from src.domain.exceptions import BusinessRuleError, DuplicateError, NotFoundError
from src.schemas.base import MessageResponse
from src.schemas.box import (
    BoxAssignmentResponse,
    BoxAssignRequest,
    BoxCreate,
    BoxListResponse,
    BoxResponse,
    BoxUpdate,
)

router = APIRouter(prefix="/boxes", tags=["Boxes"])


def _box_response(data: dict) -> BoxResponse:
    return BoxResponse(
        id=data["id"],
        nom=data["nom"],
        numero=data["numero"],
        is_active=data["is_active"],
        current_user_id=data.get("current_user_id"),
        current_user_name=data.get("current_user_name"),
        created_at=data["created_at"],
    )


@router.get("", response_model=BoxListResponse)
async def list_boxes(
    current_user: Annotated[dict, Depends(require_permission("boxes.view"))],
    box_service: Annotated[BoxService, Depends(get_box_service)],
):
    """List all boxes with occupancy info."""
    boxes = await box_service.get_all_boxes()
    return BoxListResponse(boxes=[_box_response(b) for b in boxes])


@router.post("", response_model=BoxResponse, status_code=status.HTTP_201_CREATED)
async def create_box(
    request: BoxCreate,
    current_user: Annotated[dict, Depends(require_permission("config.boxes"))],
    box_service: Annotated[BoxService, Depends(get_box_service)],
):
    """Create a new box."""
    try:
        box = await box_service.create_box(request.nom, request.numero)
        return BoxResponse(
            id=box.id,
            nom=box.nom,
            numero=box.numero,
            is_active=box.is_active,
            created_at=box.created_at,
        )
    except DuplicateError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.put("/{box_id}", response_model=BoxResponse)
async def update_box(
    box_id: str,
    request: BoxUpdate,
    current_user: Annotated[dict, Depends(require_permission("config.boxes"))],
    box_service: Annotated[BoxService, Depends(get_box_service)],
):
    """Update a box."""
    try:
        box = await box_service.update_box(
            box_id,
            nom=request.nom,
            numero=request.numero,
            is_active=request.is_active,
        )
        return BoxResponse(
            id=box.id,
            nom=box.nom,
            numero=box.numero,
            is_active=box.is_active,
            created_at=box.created_at,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DuplicateError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/{box_id}", response_model=MessageResponse)
async def delete_box(
    box_id: str,
    current_user: Annotated[dict, Depends(require_permission("config.boxes"))],
    box_service: Annotated[BoxService, Depends(get_box_service)],
):
    """Delete a box."""
    try:
        await box_service.delete_box(box_id)
        return MessageResponse(message="Box supprimé")
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/assign", response_model=BoxAssignmentResponse)
async def assign_box(
    request: BoxAssignRequest,
    current_user: CurrentUser,
    box_service: Annotated[BoxService, Depends(get_box_service)],
):
    """Assign current user to a box."""
    try:
        result = await box_service.assign_box(request.box_id, current_user["id"])
        return BoxAssignmentResponse(**result)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BusinessRuleError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/assign", response_model=MessageResponse)
async def unassign_box(
    current_user: CurrentUser,
    box_service: Annotated[BoxService, Depends(get_box_service)],
):
    """Release current user's box."""
    try:
        await box_service.unassign_box(current_user["id"])
        return MessageResponse(message="Box libéré")
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/my", response_model=BoxAssignmentResponse | None)
async def get_my_box(
    current_user: CurrentUser,
    box_service: Annotated[BoxService, Depends(get_box_service)],
):
    """Get current user's box assignment."""
    result = await box_service.get_user_box(current_user["id"])
    if not result:
        return None
    return BoxAssignmentResponse(**result)
