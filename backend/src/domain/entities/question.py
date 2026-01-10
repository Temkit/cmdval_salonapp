"""Question domain entity."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Question:
    """Domain entity for questionnaire question."""

    id: str
    texte: str
    type_reponse: str  # 'boolean', 'text', 'number', 'choice'
    options: Optional[list[str]] = None
    obligatoire: bool = False
    ordre: int = 0
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class QuestionResponse:
    """Domain entity for patient's question response."""

    id: str
    patient_id: str
    question_id: str
    reponse: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
