"""Session repository interface."""

from abc import ABC, abstractmethod
from datetime import datetime

from src.domain.entities.session import Session


class SessionRepositoryInterface(ABC):
    """Abstract interface for session repository."""

    @abstractmethod
    async def create(self, session: Session) -> Session:
        """Create a new session."""
        pass

    @abstractmethod
    async def find_by_id(self, session_id: str) -> Session | None:
        """Find session by ID."""
        pass

    @abstractmethod
    async def find_by_patient(
        self,
        patient_id: str,
        page: int,
        size: int,
    ) -> tuple[list[Session], int]:
        """
        Find sessions for a patient.

        Returns:
            Tuple of (sessions list, total count)
        """
        pass

    @abstractmethod
    async def find_all(
        self,
        page: int,
        size: int,
        praticien_id: str | None = None,
        zone_id: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[Session], int]:
        """
        Find all sessions with filters.

        Returns:
            Tuple of (sessions list, total count)
        """
        pass

    @abstractmethod
    async def count(self) -> int:
        """Count total sessions."""
        pass

    @abstractmethod
    async def count_by_zone(self) -> list[dict]:
        """
        Count sessions grouped by zone.

        Returns:
            List of {zone_id, zone_nom, count}
        """
        pass

    @abstractmethod
    async def count_by_praticien(self) -> list[dict]:
        """
        Count sessions grouped by praticien.

        Returns:
            List of {praticien_id, praticien_nom, count}
        """
        pass

    @abstractmethod
    async def count_by_period(
        self,
        date_from: datetime,
        date_to: datetime,
        group_by: str,  # 'day', 'week', 'month'
    ) -> list[dict]:
        """
        Count sessions grouped by time period.

        Returns:
            List of {period, count}
        """
        pass

    @abstractmethod
    async def recent_activity(self, limit: int = 10) -> list[Session]:
        """Get recent sessions."""
        pass
