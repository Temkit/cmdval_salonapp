"""Paiement service."""

from datetime import datetime

from src.domain.entities.paiement import Paiement
from src.domain.exceptions import NotFoundError
from src.infrastructure.database.repositories import PatientRepository
from src.infrastructure.database.repositories.paiement_repository import PaiementRepository


class PaiementService:
    """Service for payment operations."""

    def __init__(
        self,
        paiement_repo: PaiementRepository,
        patient_repo: PatientRepository,
    ):
        self.paiement_repo = paiement_repo
        self.patient_repo = patient_repo

    async def create_paiement(
        self,
        patient_id: str,
        montant: int,
        type: str,
        created_by: str | None = None,
        subscription_id: str | None = None,
        session_id: str | None = None,
        mode_paiement: str | None = None,
        reference: str | None = None,
        notes: str | None = None,
    ) -> Paiement:
        patient = await self.patient_repo.find_by_id(patient_id)
        if not patient:
            raise NotFoundError(f"Patient {patient_id} non trouvé")

        paiement = Paiement(
            patient_id=patient_id,
            montant=montant,
            type=type,
            subscription_id=subscription_id,
            session_id=session_id,
            mode_paiement=mode_paiement,
            reference=reference,
            notes=notes,
            created_by=created_by,
        )
        return await self.paiement_repo.create(paiement)

    async def get_paiement(self, paiement_id: str) -> Paiement:
        paiement = await self.paiement_repo.find_by_id(paiement_id)
        if not paiement:
            raise NotFoundError(f"Paiement {paiement_id} non trouvé")
        return paiement

    async def get_patient_paiements(self, patient_id: str) -> list[Paiement]:
        return await self.paiement_repo.find_by_patient(patient_id)

    async def list_paiements(
        self,
        patient_id: str | None = None,
        type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Paiement], int]:
        return await self.paiement_repo.find_all(
            patient_id=patient_id,
            type=type,
            date_from=date_from,
            date_to=date_to,
            page=page,
            size=size,
        )

    async def get_revenue_stats(
        self,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> dict:
        stats = await self.paiement_repo.get_revenue_stats(date_from, date_to)
        by_type = await self.paiement_repo.get_revenue_by_type(date_from, date_to)
        stats["by_type"] = by_type
        return stats
