"""Role repository implementation."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.role import Role
from src.infrastructure.database.models import RoleModel


class RoleRepository:
    """Repository for role operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, role: Role) -> Role:
        """Create a new role."""
        db_role = RoleModel(
            id=role.id,
            name=role.name,
            permissions=role.permissions,
            is_system=role.is_system,
        )
        self.session.add(db_role)
        await self.session.flush()
        return self._to_entity(db_role)

    async def find_by_id(self, role_id: str) -> Role | None:
        """Find role by ID."""
        result = await self.session.execute(select(RoleModel).where(RoleModel.id == role_id))
        db_role = result.scalar_one_or_none()
        return self._to_entity(db_role) if db_role else None

    async def find_by_name(self, name: str) -> Role | None:
        """Find role by name."""
        result = await self.session.execute(select(RoleModel).where(RoleModel.name == name))
        db_role = result.scalar_one_or_none()
        return self._to_entity(db_role) if db_role else None

    async def find_all(self) -> list[Role]:
        """Get all roles."""
        result = await self.session.execute(select(RoleModel).order_by(RoleModel.name))
        return [self._to_entity(r) for r in result.scalars()]

    async def update(self, role: Role) -> Role:
        """Update role."""
        result = await self.session.execute(select(RoleModel).where(RoleModel.id == role.id))
        db_role = result.scalar_one_or_none()
        if db_role:
            db_role.name = role.name
            db_role.permissions = role.permissions
            await self.session.flush()
            return self._to_entity(db_role)
        raise ValueError(f"Role {role.id} not found")

    async def delete(self, role_id: str) -> bool:
        """Delete role."""
        result = await self.session.execute(select(RoleModel).where(RoleModel.id == role_id))
        db_role = result.scalar_one_or_none()
        if db_role:
            await self.session.delete(db_role)
            await self.session.flush()
            return True
        return False

    def _to_entity(self, model: RoleModel) -> Role:
        """Convert model to entity."""
        return Role(
            id=model.id,
            name=model.name,
            permissions=model.permissions,
            is_system=model.is_system,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
