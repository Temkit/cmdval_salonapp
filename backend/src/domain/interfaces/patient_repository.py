"""Patient repository interface."""

from abc import ABC, abstractmethod

from src.domain.entities.patient import Patient


class PatientRepositoryInterface(ABC):
    """Abstract interface for patient repository."""

    @abstractmethod
    async def create(self, patient: Patient) -> Patient:
        """Create a new patient."""
        pass

    @abstractmethod
    async def find_by_id(self, patient_id: str) -> Patient | None:
        """Find patient by ID."""
        pass

    @abstractmethod
    async def find_by_card_code(self, code: str) -> Patient | None:
        """Find patient by card code."""
        pass

    @abstractmethod
    async def search(
        self,
        query: str,
        page: int,
        size: int,
    ) -> tuple[list[Patient], int]:
        """
        Search patients by name, phone, or card code.

        Returns:
            Tuple of (patients list, total count)
        """
        pass

    @abstractmethod
    async def find_all(
        self,
        page: int,
        size: int,
    ) -> tuple[list[Patient], int]:
        """
        Get all patients with pagination.

        Returns:
            Tuple of (patients list, total count)
        """
        pass

    @abstractmethod
    async def update(self, patient: Patient) -> Patient:
        """Update patient."""
        pass

    @abstractmethod
    async def delete(self, patient_id: str) -> bool:
        """Delete patient."""
        pass

    @abstractmethod
    async def count(self) -> int:
        """Count total patients."""
        pass
