"""Question service."""

from typing import Any

from src.domain.entities.question import Question, QuestionResponse
from src.domain.exceptions import PatientNotFoundError, QuestionNotFoundError
from src.infrastructure.database.repositories import (
    PatientRepository,
    QuestionRepository,
    QuestionResponseRepository,
)


class QuestionService:
    """Service for question operations."""

    def __init__(self, question_repository: QuestionRepository):
        self.question_repository = question_repository

    async def create_question(
        self,
        texte: str,
        type_reponse: str = "boolean",
        options: list[str] | None = None,
        obligatoire: bool = True,
    ) -> Question:
        """Create a new question."""
        # Get next ordre value
        max_ordre = await self.question_repository.get_max_ordre()

        question = Question(
            texte=texte,
            type_reponse=type_reponse,
            options=options,
            ordre=max_ordre + 1,
            obligatoire=obligatoire,
        )

        return await self.question_repository.create(question)

    async def get_question(self, question_id: str) -> Question:
        """Get question by ID."""
        question = await self.question_repository.find_by_id(question_id)
        if not question:
            raise QuestionNotFoundError(question_id)
        return question

    async def get_all_questions(
        self, include_inactive: bool = False
    ) -> list[Question]:
        """Get all questions."""
        return await self.question_repository.find_all(include_inactive)

    async def update_question(
        self,
        question_id: str,
        texte: str | None = None,
        type_reponse: str | None = None,
        options: list[str] | None = None,
        obligatoire: bool | None = None,
        is_active: bool | None = None,
    ) -> Question:
        """Update question."""
        question = await self.question_repository.find_by_id(question_id)
        if not question:
            raise QuestionNotFoundError(question_id)

        if texte:
            question.texte = texte
        if type_reponse:
            question.type_reponse = type_reponse
        if options is not None:
            question.options = options
        if obligatoire is not None:
            question.obligatoire = obligatoire
        if is_active is not None:
            question.is_active = is_active

        return await self.question_repository.update(question)

    async def delete_question(self, question_id: str) -> bool:
        """Delete question."""
        question = await self.question_repository.find_by_id(question_id)
        if not question:
            raise QuestionNotFoundError(question_id)
        return await self.question_repository.delete(question_id)

    async def update_order(self, question_ids: list[str]) -> list[Question]:
        """Update question order."""
        return await self.question_repository.update_order(question_ids)


class QuestionnaireService:
    """Service for patient questionnaire operations."""

    def __init__(
        self,
        question_repository: QuestionRepository,
        response_repository: QuestionResponseRepository,
        patient_repository: PatientRepository,
    ):
        self.question_repository = question_repository
        self.response_repository = response_repository
        self.patient_repository = patient_repository

    async def get_patient_questionnaire(
        self, patient_id: str
    ) -> dict:
        """Get patient questionnaire with responses."""
        patient = await self.patient_repository.find_by_id(patient_id)
        if not patient:
            raise PatientNotFoundError(patient_id)

        questions = await self.question_repository.find_all(include_inactive=False)
        responses = await self.response_repository.find_by_patient(patient_id)

        # Map responses by question ID
        response_map = {r.question_id: r for r in responses}

        # Build questionnaire data
        response_items = []
        for response in responses:
            response_items.append({
                "id": response.id,
                "question_id": response.question_id,
                "question_texte": response.question_texte,
                "question_type": response.question_type,
                "reponse": response.reponse,
                "created_at": response.created_at,
                "updated_at": response.updated_at,
            })

        required_count = sum(1 for q in questions if q.obligatoire)
        answered_required = sum(
            1 for q in questions
            if q.obligatoire and q.id in response_map
        )

        return {
            "patient_id": patient_id,
            "responses": response_items,
            "total_questions": len(questions),
            "answered_questions": len(responses),
            "is_complete": answered_required >= required_count,
        }

    async def update_patient_questionnaire(
        self,
        patient_id: str,
        responses: list[dict],
    ) -> dict:
        """Update patient questionnaire responses."""
        patient = await self.patient_repository.find_by_id(patient_id)
        if not patient:
            raise PatientNotFoundError(patient_id)

        # Process each response
        for response_data in responses:
            question_id = response_data["question_id"]
            reponse = response_data["reponse"]

            # Verify question exists
            question = await self.question_repository.find_by_id(question_id)
            if not question:
                continue

            response = QuestionResponse(
                patient_id=patient_id,
                question_id=question_id,
                reponse=reponse,
            )
            await self.response_repository.upsert(response)

        return await self.get_patient_questionnaire(patient_id)

    async def is_questionnaire_complete(self, patient_id: str) -> bool:
        """Check if patient questionnaire is complete."""
        questions = await self.question_repository.find_all(include_inactive=False)
        responses = await self.response_repository.find_by_patient(patient_id)

        response_ids = {r.question_id for r in responses}
        required_ids = {q.id for q in questions if q.obligatoire}

        return required_ids.issubset(response_ids)
