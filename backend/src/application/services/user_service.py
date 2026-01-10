"""User service."""

from src.domain.entities.user import User
from src.domain.exceptions import (
    DuplicateUsernameError,
    RoleInUseError,
    RoleNotFoundError,
    SystemRoleError,
    UserNotFoundError,
)
from src.infrastructure.database.repositories import RoleRepository, UserRepository
from src.infrastructure.security.password import hash_password


class UserService:
    """Service for user operations."""

    def __init__(
        self,
        user_repository: UserRepository,
        role_repository: RoleRepository,
    ):
        self.user_repository = user_repository
        self.role_repository = role_repository

    async def create_user(
        self,
        username: str,
        password: str,
        nom: str,
        prenom: str,
        role_id: str,
    ) -> User:
        """Create a new user."""
        # Check if username already exists
        existing = await self.user_repository.find_by_username(username)
        if existing:
            raise DuplicateUsernameError(username)

        # Verify role exists
        role = await self.role_repository.find_by_id(role_id)
        if not role:
            raise RoleNotFoundError(role_id)

        user = User(
            username=username,
            password_hash=hash_password(password),
            nom=nom,
            prenom=prenom,
            role_id=role_id,
        )

        return await self.user_repository.create(user)

    async def get_user(self, user_id: str) -> User:
        """Get user by ID."""
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        return user

    async def get_all_users(self) -> list[User]:
        """Get all users."""
        return await self.user_repository.find_all()

    async def update_user(
        self,
        user_id: str,
        username: str | None = None,
        nom: str | None = None,
        prenom: str | None = None,
        role_id: str | None = None,
        is_active: bool | None = None,
        password: str | None = None,
    ) -> User:
        """Update user."""
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)

        if username and username != user.username:
            existing = await self.user_repository.find_by_username(username)
            if existing:
                raise DuplicateUsernameError(username)
            user.username = username

        if nom:
            user.nom = nom
        if prenom:
            user.prenom = prenom
        if role_id:
            role = await self.role_repository.find_by_id(role_id)
            if not role:
                raise RoleNotFoundError(role_id)
            user.role_id = role_id
        if is_active is not None:
            user.is_active = is_active
        if password:
            user.password_hash = hash_password(password)

        return await self.user_repository.update(user)

    async def delete_user(self, user_id: str) -> bool:
        """Delete user."""
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        return await self.user_repository.delete(user_id)


class RoleService:
    """Service for role operations."""

    def __init__(
        self,
        role_repository: RoleRepository,
        user_repository: UserRepository,
    ):
        self.role_repository = role_repository
        self.user_repository = user_repository

    async def create_role(
        self,
        nom: str,
        permissions: list[str],
    ) -> "Role":
        """Create a new role."""
        from src.domain.entities.role import Role

        # Check if name already exists
        existing = await self.role_repository.find_by_name(nom)
        if existing:
            raise ValueError(f"Un rôle avec le nom '{nom}' existe déjà")

        role = Role(
            name=nom,
            permissions=permissions,
            is_system=False,
        )

        return await self.role_repository.create(role)

    async def get_role(self, role_id: str) -> "Role":
        """Get role by ID."""
        role = await self.role_repository.find_by_id(role_id)
        if not role:
            raise RoleNotFoundError(role_id)
        return role

    async def get_all_roles(self) -> list["Role"]:
        """Get all roles."""
        return await self.role_repository.find_all()

    async def update_role(
        self,
        role_id: str,
        nom: str | None = None,
        permissions: list[str] | None = None,
    ) -> "Role":
        """Update role."""
        role = await self.role_repository.find_by_id(role_id)
        if not role:
            raise RoleNotFoundError(role_id)

        if role.is_system:
            raise SystemRoleError("Impossible de modifier un rôle système")

        if nom and nom != role.name:
            existing = await self.role_repository.find_by_name(nom)
            if existing:
                raise ValueError(f"Un rôle avec le nom '{nom}' existe déjà")
            role.name = nom

        if permissions is not None:
            role.permissions = permissions

        return await self.role_repository.update(role)

    async def delete_role(self, role_id: str) -> bool:
        """Delete role."""
        role = await self.role_repository.find_by_id(role_id)
        if not role:
            raise RoleNotFoundError(role_id)

        if role.is_system:
            raise SystemRoleError("Impossible de supprimer un rôle système")

        # Check if role is in use
        user_count = await self.user_repository.count_by_role(role_id)
        if user_count > 0:
            raise RoleInUseError(role_id, user_count)

        return await self.role_repository.delete(role_id)
