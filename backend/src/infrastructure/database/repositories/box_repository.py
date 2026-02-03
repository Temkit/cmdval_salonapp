"""Box and BoxAssignment repository implementations."""

from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.box import Box, BoxAssignment
from src.infrastructure.database.models import BoxAssignmentModel, BoxModel, UserModel


class BoxRepository:
    """Repository for box CRUD operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, box: Box) -> Box:
        db = BoxModel(
            id=box.id,
            nom=box.nom,
            numero=box.numero,
            is_active=box.is_active,
        )
        self.session.add(db)
        await self.session.flush()
        return self._to_entity(db)

    async def find_all(self, include_inactive: bool = False) -> list[Box]:
        query = select(BoxModel).order_by(BoxModel.numero)
        if not include_inactive:
            query = query.where(BoxModel.is_active == True)  # noqa: E712
        result = await self.session.execute(query)
        return [self._to_entity(b) for b in result.scalars()]

    async def find_by_id(self, box_id: str) -> Box | None:
        result = await self.session.execute(
            select(BoxModel).where(BoxModel.id == box_id)
        )
        db = result.scalar_one_or_none()
        return self._to_entity(db) if db else None

    async def find_by_numero(self, numero: int) -> Box | None:
        result = await self.session.execute(
            select(BoxModel).where(BoxModel.numero == numero)
        )
        db = result.scalar_one_or_none()
        return self._to_entity(db) if db else None

    async def update(self, box_id: str, **kwargs) -> Box | None:
        result = await self.session.execute(
            select(BoxModel).where(BoxModel.id == box_id)
        )
        db = result.scalar_one_or_none()
        if not db:
            return None
        for key, value in kwargs.items():
            if hasattr(db, key):
                setattr(db, key, value)
        await self.session.flush()
        return self._to_entity(db)

    async def delete(self, box_id: str) -> bool:
        result = await self.session.execute(
            select(BoxModel).where(BoxModel.id == box_id)
        )
        db = result.scalar_one_or_none()
        if not db:
            return False
        await self.session.delete(db)
        await self.session.flush()
        return True

    def _to_entity(self, model: BoxModel) -> Box:
        return Box(
            id=model.id,
            nom=model.nom,
            numero=model.numero,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class BoxAssignmentRepository:
    """Repository for box assignment operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def assign(self, box_id: str, user_id: str) -> BoxAssignment:
        """Assign a user to a box. Removes any previous assignment for this user."""
        # Remove user's current assignment if any
        await self.session.execute(
            delete(BoxAssignmentModel).where(BoxAssignmentModel.user_id == user_id)
        )
        # Remove any assignment on this box
        await self.session.execute(
            delete(BoxAssignmentModel).where(BoxAssignmentModel.box_id == box_id)
        )
        await self.session.flush()

        db = BoxAssignmentModel(box_id=box_id, user_id=user_id)
        self.session.add(db)
        await self.session.flush()
        return await self._to_entity(db)

    async def unassign_user(self, user_id: str) -> bool:
        result = await self.session.execute(
            select(BoxAssignmentModel).where(BoxAssignmentModel.user_id == user_id)
        )
        db = result.scalar_one_or_none()
        if not db:
            return False
        await self.session.delete(db)
        await self.session.flush()
        return True

    async def get_by_user(self, user_id: str) -> BoxAssignment | None:
        result = await self.session.execute(
            select(BoxAssignmentModel).where(BoxAssignmentModel.user_id == user_id)
        )
        db = result.scalar_one_or_none()
        if not db:
            return None
        return await self._to_entity(db)

    async def get_by_box(self, box_id: str) -> BoxAssignment | None:
        result = await self.session.execute(
            select(BoxAssignmentModel).where(BoxAssignmentModel.box_id == box_id)
        )
        db = result.scalar_one_or_none()
        if not db:
            return None
        return await self._to_entity(db)

    async def get_all_assignments(self) -> list[BoxAssignment]:
        result = await self.session.execute(select(BoxAssignmentModel))
        assignments = []
        for db in result.scalars():
            assignments.append(await self._to_entity(db))
        return assignments

    async def is_box_available(self, box_id: str) -> bool:
        result = await self.session.execute(
            select(BoxAssignmentModel).where(BoxAssignmentModel.box_id == box_id)
        )
        return result.scalar_one_or_none() is None

    async def _to_entity(self, model: BoxAssignmentModel) -> BoxAssignment:
        # Fetch box name
        box_result = await self.session.execute(
            select(BoxModel.nom).where(BoxModel.id == model.box_id)
        )
        box_nom = box_result.scalar_one_or_none() or ""

        # Fetch user name
        user_result = await self.session.execute(
            select(UserModel.nom, UserModel.prenom).where(UserModel.id == model.user_id)
        )
        user_row = user_result.one_or_none()
        user_nom = user_row[0] if user_row else ""
        user_prenom = user_row[1] if user_row else ""

        return BoxAssignment(
            id=model.id,
            box_id=model.box_id,
            user_id=model.user_id,
            box_nom=box_nom,
            user_nom=user_nom,
            user_prenom=user_prenom,
            assigned_at=model.assigned_at,
        )
