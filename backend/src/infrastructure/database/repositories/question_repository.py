"""Question repository implementation."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.domain.entities.question import Question, QuestionResponse
from src.infrastructure.database.models import QuestionModel, QuestionResponseModel


class QuestionRepository:
    """Repository for question operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, question: Question) -> Question:
        """Create a new question."""
        db_question = QuestionModel(
            id=question.id,
            texte=question.texte,
            type_reponse=question.type_reponse,
            options=question.options,
            ordre=question.ordre,
            obligatoire=question.obligatoire,
            is_active=question.is_active,
        )
        self.session.add(db_question)
        await self.session.flush()
        return self._to_entity(db_question)

    async def find_by_id(self, question_id: str) -> Question | None:
        """Find question by ID."""
        result = await self.session.execute(
            select(QuestionModel).where(QuestionModel.id == question_id)
        )
        db_question = result.scalar_one_or_none()
        return self._to_entity(db_question) if db_question else None

    async def find_all(self, include_inactive: bool = False) -> list[Question]:
        """Get all questions."""
        query = select(QuestionModel).order_by(QuestionModel.ordre)
        if not include_inactive:
            query = query.where(QuestionModel.is_active == True)  # noqa: E712
        result = await self.session.execute(query)
        return [self._to_entity(q) for q in result.scalars()]

    async def update(self, question: Question) -> Question:
        """Update question."""
        result = await self.session.execute(
            select(QuestionModel).where(QuestionModel.id == question.id)
        )
        db_question = result.scalar_one_or_none()
        if db_question:
            db_question.texte = question.texte
            db_question.type_reponse = question.type_reponse
            db_question.options = question.options
            db_question.ordre = question.ordre
            db_question.obligatoire = question.obligatoire
            db_question.is_active = question.is_active
            await self.session.flush()
            return self._to_entity(db_question)
        raise ValueError(f"Question {question.id} not found")

    async def delete(self, question_id: str) -> bool:
        """Delete question."""
        result = await self.session.execute(
            select(QuestionModel).where(QuestionModel.id == question_id)
        )
        db_question = result.scalar_one_or_none()
        if db_question:
            await self.session.delete(db_question)
            await self.session.flush()
            return True
        return False

    async def update_order(self, question_ids: list[str]) -> list[Question]:
        """Update question order."""
        for i, question_id in enumerate(question_ids):
            result = await self.session.execute(
                select(QuestionModel).where(QuestionModel.id == question_id)
            )
            db_question = result.scalar_one_or_none()
            if db_question:
                db_question.ordre = i
        await self.session.flush()
        return await self.find_all(include_inactive=True)

    async def get_max_ordre(self) -> int:
        """Get maximum ordre value."""
        result = await self.session.execute(
            select(func.max(QuestionModel.ordre))
        )
        return result.scalar() or 0

    def _to_entity(self, model: QuestionModel) -> Question:
        """Convert model to entity."""
        return Question(
            id=model.id,
            texte=model.texte,
            type_reponse=model.type_reponse,
            options=model.options,
            ordre=model.ordre,
            obligatoire=model.obligatoire,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class QuestionResponseRepository:
    """Repository for question response operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert(self, response: QuestionResponse) -> QuestionResponse:
        """Create or update a question response."""
        result = await self.session.execute(
            select(QuestionResponseModel).where(
                QuestionResponseModel.pre_consultation_id == response.pre_consultation_id,
                QuestionResponseModel.question_id == response.question_id,
            )
        )
        db_response = result.scalar_one_or_none()

        if db_response:
            db_response.reponse = response.reponse
        else:
            db_response = QuestionResponseModel(
                id=response.id,
                pre_consultation_id=response.pre_consultation_id,
                question_id=response.question_id,
                reponse=response.reponse,
            )
            self.session.add(db_response)

        await self.session.flush()
        return await self.find_by_id(db_response.id)  # type: ignore

    async def find_by_id(self, response_id: str) -> QuestionResponse | None:
        """Find response by ID."""
        result = await self.session.execute(
            select(QuestionResponseModel)
            .options(joinedload(QuestionResponseModel.question))
            .where(QuestionResponseModel.id == response_id)
        )
        db_response = result.unique().scalar_one_or_none()
        return self._to_entity(db_response) if db_response else None

    async def find_by_pre_consultation(self, pre_consultation_id: str) -> list[QuestionResponse]:
        """Find all responses for a pre-consultation."""
        result = await self.session.execute(
            select(QuestionResponseModel)
            .options(joinedload(QuestionResponseModel.question))
            .where(QuestionResponseModel.pre_consultation_id == pre_consultation_id)
        )
        return [self._to_entity(r) for r in result.unique().scalars()]

    async def count_by_pre_consultation(self, pre_consultation_id: str) -> int:
        """Count responses for a pre-consultation."""
        result = await self.session.execute(
            select(func.count(QuestionResponseModel.id)).where(
                QuestionResponseModel.pre_consultation_id == pre_consultation_id
            )
        )
        return result.scalar() or 0

    async def delete_by_pre_consultation(self, pre_consultation_id: str) -> int:
        """Delete all responses for a pre-consultation."""
        result = await self.session.execute(
            select(QuestionResponseModel).where(
                QuestionResponseModel.pre_consultation_id == pre_consultation_id
            )
        )
        responses = result.scalars().all()
        count = len(responses)
        for response in responses:
            await self.session.delete(response)
        await self.session.flush()
        return count

    def _to_entity(self, model: QuestionResponseModel) -> QuestionResponse:
        """Convert model to entity."""
        return QuestionResponse(
            id=model.id,
            pre_consultation_id=model.pre_consultation_id,
            question_id=model.question_id,
            question_texte=model.question.texte if model.question else "",
            question_type=model.question.type_reponse if model.question else "text",
            reponse=model.reponse,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
