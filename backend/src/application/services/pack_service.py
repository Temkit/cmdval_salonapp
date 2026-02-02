"""Pack and subscription services."""

from datetime import date, timedelta

from src.domain.entities.pack import Pack, PatientSubscription
from src.domain.exceptions import NotFoundError
from src.infrastructure.database.repositories import PatientRepository
from src.infrastructure.database.repositories.pack_repository import (
    PackRepository,
    PatientSubscriptionRepository,
)


class PackService:
    """Service for pack operations."""

    def __init__(self, pack_repo: PackRepository):
        self.pack_repo = pack_repo

    async def create_pack(
        self,
        nom: str,
        prix: int,
        description: str | None = None,
        zone_ids: list[str] | None = None,
        duree_jours: int | None = None,
        seances_per_zone: int = 6,
    ) -> Pack:
        pack = Pack(
            nom=nom,
            prix=prix,
            description=description,
            zone_ids=zone_ids or [],
            duree_jours=duree_jours,
            seances_per_zone=seances_per_zone,
        )
        return await self.pack_repo.create(pack)

    async def get_pack(self, pack_id: str) -> Pack:
        pack = await self.pack_repo.find_by_id(pack_id)
        if not pack:
            raise NotFoundError(f"Pack {pack_id} non trouvé")
        return pack

    async def get_all_packs(self, include_inactive: bool = False) -> list[Pack]:
        return await self.pack_repo.find_all(include_inactive)

    async def update_pack(self, pack_id: str, **kwargs) -> Pack:
        pack = await self.get_pack(pack_id)
        for key, value in kwargs.items():
            if value is not None and hasattr(pack, key):
                setattr(pack, key, value)
        return await self.pack_repo.update(pack)

    async def delete_pack(self, pack_id: str) -> bool:
        await self.get_pack(pack_id)
        return await self.pack_repo.delete(pack_id)


class SubscriptionService:
    """Service for patient subscription operations."""

    def __init__(
        self,
        subscription_repo: PatientSubscriptionRepository,
        pack_repo: PackRepository,
        patient_repo: PatientRepository,
    ):
        self.subscription_repo = subscription_repo
        self.pack_repo = pack_repo
        self.patient_repo = patient_repo

    async def create_subscription(
        self,
        patient_id: str,
        type: str,
        pack_id: str | None = None,
        montant_paye: int = 0,
        notes: str | None = None,
    ) -> PatientSubscription:
        # Verify patient exists
        patient = await self.patient_repo.find_by_id(patient_id)
        if not patient:
            raise NotFoundError(f"Patient {patient_id} non trouvé")

        date_debut = date.today()
        date_fin = None

        if pack_id:
            pack = await self.pack_repo.find_by_id(pack_id)
            if not pack:
                raise NotFoundError(f"Pack {pack_id} non trouvé")
            if pack.duree_jours:
                date_fin = date_debut + timedelta(days=pack.duree_jours)

        subscription = PatientSubscription(
            patient_id=patient_id,
            type=type,
            pack_id=pack_id,
            date_debut=date_debut,
            date_fin=date_fin,
            montant_paye=montant_paye,
            notes=notes,
        )
        return await self.subscription_repo.create(subscription)

    async def get_patient_subscriptions(self, patient_id: str) -> list[PatientSubscription]:
        return await self.subscription_repo.find_by_patient(patient_id)

    async def get_active_subscriptions(self, patient_id: str) -> list[PatientSubscription]:
        return await self.subscription_repo.find_active_by_patient(patient_id)
