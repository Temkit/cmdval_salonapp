"""Questionnaire management endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.v1.dependencies import get_question_service, require_permission
from src.application.services import QuestionService
from src.domain.exceptions import QuestionNotFoundError
from src.schemas.base import MessageResponse
from src.schemas.questionnaire import (
    QuestionCreate,
    QuestionListResponse,
    QuestionOrderUpdate,
    QuestionResponse,
    QuestionUpdate,
)

router = APIRouter(prefix="/questionnaire", tags=["Questionnaire"])


@router.get("/questions", response_model=QuestionListResponse)
async def list_questions(
    _: Annotated[dict, Depends(require_permission("patients.questionnaire.view"))],
    question_service: Annotated[QuestionService, Depends(get_question_service)],
    include_inactive: bool = Query(False, description="Inclure les questions inactives"),
):
    """List all questions."""
    questions = await question_service.get_all_questions(include_inactive=include_inactive)
    return QuestionListResponse(
        questions=[
            QuestionResponse(
                id=q.id,
                texte=q.texte,
                type_reponse=q.type_reponse,
                options=q.options,
                ordre=q.ordre,
                obligatoire=q.obligatoire,
                is_active=q.is_active,
                created_at=q.created_at,
                updated_at=q.updated_at,
            )
            for q in questions
        ]
    )


@router.post(
    "/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_question(
    request: QuestionCreate,
    _: Annotated[dict, Depends(require_permission("config.questionnaire"))],
    question_service: Annotated[QuestionService, Depends(get_question_service)],
):
    """Create a new question."""
    question = await question_service.create_question(
        texte=request.texte,
        type_reponse=request.type_reponse,
        options=request.options,
        obligatoire=request.obligatoire,
    )
    return QuestionResponse(
        id=question.id,
        texte=question.texte,
        type_reponse=question.type_reponse,
        options=question.options,
        ordre=question.ordre,
        obligatoire=question.obligatoire,
        is_active=question.is_active,
        created_at=question.created_at,
        updated_at=question.updated_at,
    )


@router.put("/questions/order", response_model=QuestionListResponse)
async def update_question_order(
    request: QuestionOrderUpdate,
    _: Annotated[dict, Depends(require_permission("config.questionnaire"))],
    question_service: Annotated[QuestionService, Depends(get_question_service)],
):
    """Update question order."""
    questions = await question_service.update_order(request.question_ids)
    return QuestionListResponse(
        questions=[
            QuestionResponse(
                id=q.id,
                texte=q.texte,
                type_reponse=q.type_reponse,
                options=q.options,
                ordre=q.ordre,
                obligatoire=q.obligatoire,
                is_active=q.is_active,
                created_at=q.created_at,
                updated_at=q.updated_at,
            )
            for q in questions
        ]
    )


@router.get("/questions/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: str,
    _: Annotated[dict, Depends(require_permission("patients.questionnaire.view"))],
    question_service: Annotated[QuestionService, Depends(get_question_service)],
):
    """Get question by ID."""
    try:
        question = await question_service.get_question(question_id)
        return QuestionResponse(
            id=question.id,
            texte=question.texte,
            type_reponse=question.type_reponse,
            options=question.options,
            ordre=question.ordre,
            obligatoire=question.obligatoire,
            is_active=question.is_active,
            created_at=question.created_at,
            updated_at=question.updated_at,
        )
    except QuestionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    request: QuestionUpdate,
    _: Annotated[dict, Depends(require_permission("config.questionnaire"))],
    question_service: Annotated[QuestionService, Depends(get_question_service)],
):
    """Update question."""
    try:
        question = await question_service.update_question(
            question_id=question_id,
            texte=request.texte,
            type_reponse=request.type_reponse,
            options=request.options,
            obligatoire=request.obligatoire,
            is_active=request.is_active,
        )
        return QuestionResponse(
            id=question.id,
            texte=question.texte,
            type_reponse=question.type_reponse,
            options=question.options,
            ordre=question.ordre,
            obligatoire=question.obligatoire,
            is_active=question.is_active,
            created_at=question.created_at,
            updated_at=question.updated_at,
        )
    except QuestionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/questions/{question_id}", response_model=MessageResponse)
async def delete_question(
    question_id: str,
    _: Annotated[dict, Depends(require_permission("config.questionnaire"))],
    question_service: Annotated[QuestionService, Depends(get_question_service)],
):
    """Delete question."""
    try:
        await question_service.delete_question(question_id)
        return MessageResponse(message="Question supprimée")
    except QuestionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
