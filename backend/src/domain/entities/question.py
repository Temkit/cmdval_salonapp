"""Question domain entity."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import uuid4


@dataclass
class Question:
    """Domain entity for questionnaire question."""

    id: str
    texte: str
    type_reponse: str  # 'boolean', 'text', 'number', 'choice'
    options: list[str] | None = None
    obligatoire: bool = False
    ordre: int = 0
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


@dataclass
class QuestionResponse:
    """Domain entity for pre-consultation question response."""

    pre_consultation_id: str
    question_id: str
    reponse: Any = None
    id: str = field(default_factory=lambda: str(uuid4()))
    question_texte: str = ""
    question_type: str = "text"
    created_at: datetime | None = None
    updated_at: datetime | None = None
