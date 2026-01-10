"""User repository implementation."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.domain.entities.user import User
from src.domain.interfaces.user_repository import UserRepositoryInterface
from src.infrastructure.database.models import RoleModel, UserModel


class UserRepository(UserRepositoryInterface):
    """Repository for user operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user: User) -> User:
        """Create a new user."""
        db_user = UserModel(
            id=user.id,
            username=user.username,
            password_hash=user.password_hash,
            nom=user.nom,
            prenom=user.prenom,
            role_id=user.role_id,
            is_active=user.is_active,
        )
        self.session.add(db_user)
        await self.session.flush()
        return await self.find_by_id(db_user.id)  # type: ignore

    async def find_by_id(self, user_id: str) -> User | None:
        """Find user by ID."""
        result = await self.session.execute(
            select(UserModel)
            .options(joinedload(UserModel.role))
            .where(UserModel.id == user_id)
        )
        db_user = result.unique().scalar_one_or_none()
        return self._to_entity(db_user) if db_user else None

    async def find_by_username(self, username: str) -> User | None:
        """Find user by username."""
        result = await self.session.execute(
            select(UserModel)
            .options(joinedload(UserModel.role))
            .where(UserModel.username == username)
        )
        db_user = result.unique().scalar_one_or_none()
        return self._to_entity(db_user) if db_user else None

    async def find_all(self) -> list[User]:
        """Get all users."""
        result = await self.session.execute(
            select(UserModel)
            .options(joinedload(UserModel.role))
            .order_by(UserModel.nom, UserModel.prenom)
        )
        return [self._to_entity(u) for u in result.unique().scalars()]

    async def update(self, user: User) -> User:
        """Update user."""
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user.id)
        )
        db_user = result.scalar_one_or_none()
        if db_user:
            db_user.username = user.username
            db_user.nom = user.nom
            db_user.prenom = user.prenom
            db_user.role_id = user.role_id
            db_user.is_active = user.is_active
            if user.password_hash:
                db_user.password_hash = user.password_hash
            await self.session.flush()
            return await self.find_by_id(db_user.id)  # type: ignore
        raise ValueError(f"User {user.id} not found")

    async def delete(self, user_id: str) -> bool:
        """Delete user."""
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        db_user = result.scalar_one_or_none()
        if db_user:
            await self.session.delete(db_user)
            await self.session.flush()
            return True
        return False

    async def count_by_role(self, role_id: str) -> int:
        """Count users with a specific role."""
        result = await self.session.execute(
            select(func.count(UserModel.id)).where(UserModel.role_id == role_id)
        )
        return result.scalar() or 0

    def _to_entity(self, model: UserModel) -> User:
        """Convert model to entity."""
        return User(
            id=model.id,
            username=model.username,
            password_hash=model.password_hash,
            nom=model.nom,
            prenom=model.prenom,
            role_id=model.role_id,
            role_name=model.role.name if model.role else None,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
