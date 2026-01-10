"""User repository interface."""

from abc import ABC, abstractmethod

from src.domain.entities.user import User


class UserRepositoryInterface(ABC):
    """Abstract interface for user repository."""

    @abstractmethod
    async def create(self, user: User) -> User:
        """Create a new user."""
        pass

    @abstractmethod
    async def find_by_id(self, user_id: str) -> User | None:
        """Find user by ID."""
        pass

    @abstractmethod
    async def find_by_username(self, username: str) -> User | None:
        """Find user by username."""
        pass

    @abstractmethod
    async def find_all(self) -> list[User]:
        """Get all users."""
        pass

    @abstractmethod
    async def update(self, user: User) -> User:
        """Update user."""
        pass

    @abstractmethod
    async def delete(self, user_id: str) -> bool:
        """Delete user."""
        pass

    @abstractmethod
    async def count_by_role(self, role_id: str) -> int:
        """Count users with a specific role."""
        pass
