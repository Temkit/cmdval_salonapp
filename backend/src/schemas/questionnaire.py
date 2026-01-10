"""Questionnaire schemas."""

from datetime import datetime
from typing import Any

from pydantic import Field

from src.schemas.base import AppBaseModel


# Question schemas
class QuestionBase(AppBaseModel):
    """Base question schema."""

    texte: str = Field(min_length=1)
    type_reponse: str = Field(default="boolean", pattern=r"^(boolean|text|choice|multiple)$")
    options: list[str] | None = None
    obligatoire: bool = True


class QuestionCreate(QuestionBase):
    """Question creation schema."""

    ordre: int = Field(default=0, ge=0)


class QuestionUpdate(AppBaseModel):
    """Question update schema."""

    texte: str | None = Field(default=None, min_length=1)
    type_reponse: str | None = Field(
        default=None, pattern=r"^(boolean|text|choice|multiple)$"
    )
    options: list[str] | None = None
    obligatoire: bool | None = None
    is_active: bool | None = None


class QuestionResponse(QuestionBase):
    """Question response schema."""

    id: str
    ordre: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class QuestionListResponse(AppBaseModel):
    """Question list response."""

    questions: list[QuestionResponse]


class QuestionOrderUpdate(AppBaseModel):
    """Question order update schema."""

    question_ids: list[str]


# Question response schemas
class QuestionResponseBase(AppBaseModel):
    """Base question response schema."""

    question_id: str
    reponse: Any


class QuestionResponseCreate(QuestionResponseBase):
    """Question response creation schema."""

    pass


class QuestionResponseUpdate(AppBaseModel):
    """Question response update schema."""

    reponse: Any


class QuestionResponseItem(AppBaseModel):
    """Question response item schema."""

    id: str
    question_id: str
    question_texte: str
    question_type: str
    reponse: Any
    created_at: datetime
    updated_at: datetime


class PatientQuestionnaireResponse(AppBaseModel):
    """Patient questionnaire response schema."""

    patient_id: str
    responses: list[QuestionResponseItem]
    total_questions: int
    answered_questions: int
    is_complete: bool


class PatientQuestionnaireUpdate(AppBaseModel):
    """Patient questionnaire update schema."""

    responses: list[QuestionResponseCreate]
