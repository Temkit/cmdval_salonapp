"""Authentication service."""

from src.domain.exceptions import (
    AuthenticationError,
    InvalidCredentialsError,
)
from src.infrastructure.database.repositories import RoleRepository, UserRepository
from src.infrastructure.security.jwt import create_access_token
from src.infrastructure.security.password import hash_password, verify_password


class AuthService:
    """Service for authentication operations."""

    def __init__(
        self,
        user_repository: UserRepository,
        role_repository: RoleRepository,
    ):
        self.user_repository = user_repository
        self.role_repository = role_repository

    async def login(self, username: str, password: str) -> tuple[str, dict]:
        """
        Authenticate user and return token.

        Returns:
            Tuple of (access_token, user_info)
        """
        user = await self.user_repository.find_by_username(username)
        if not user:
            raise InvalidCredentialsError()

        if not user.is_active:
            raise AuthenticationError("Compte désactivé")

        if not verify_password(password, user.password_hash):
            raise InvalidCredentialsError()

        # Get role for permissions
        role = await self.role_repository.find_by_id(user.role_id)
        permissions = role.permissions if role else []

        token = create_access_token(
            user_id=user.id,
            username=user.username,
            role=role.name if role else "",
            permissions=permissions,
        )

        user_info = {
            "id": user.id,
            "username": user.username,
            "nom": user.nom,
            "prenom": user.prenom,
            "role_id": user.role_id,
            "role_nom": user.role_name or "",
            "permissions": permissions,
        }

        return token, user_info

    async def get_current_user(self, user_id: str) -> dict:
        """Get current user info with permissions."""
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise AuthenticationError("Utilisateur non trouvé")

        if not user.is_active:
            raise AuthenticationError("Compte désactivé")

        role = await self.role_repository.find_by_id(user.role_id)
        permissions = role.permissions if role else []

        return {
            "id": user.id,
            "username": user.username,
            "nom": user.nom,
            "prenom": user.prenom,
            "role_id": user.role_id,
            "role_nom": user.role_name or "",
            "permissions": permissions,
        }

    async def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str,
    ) -> bool:
        """Change user password."""
        user = await self.user_repository.find_by_id(user_id)
        if not user:
            raise AuthenticationError("Utilisateur non trouvé")

        if not verify_password(current_password, user.password_hash):
            raise InvalidCredentialsError("Mot de passe actuel incorrect")

        user.password_hash = hash_password(new_password)
        await self.user_repository.update(user)
        return True
