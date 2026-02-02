"""Pack and subscription repository implementations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.domain.entities.pack import Pack, PatientSubscription
from src.infrastructure.database.models import PackModel, PatientSubscriptionModel


class PackRepository:
    """Repository for pack operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, pack: Pack) -> Pack:
        db_pack = PackModel(
            id=pack.id,
            nom=pack.nom,
            description=pack.description,
            zone_ids=pack.zone_ids,
            prix=pack.prix,
            duree_jours=pack.duree_jours,
            seances_per_zone=pack.seances_per_zone,
            is_active=pack.is_active,
        )
        self.session.add(db_pack)
        await self.session.flush()
        return self._to_entity(db_pack)

    async def find_by_id(self, pack_id: str) -> Pack | None:
        result = await self.session.execute(select(PackModel).where(PackModel.id == pack_id))
        db_pack = result.scalar_one_or_none()
        return self._to_entity(db_pack) if db_pack else None

    async def find_all(self, include_inactive: bool = False) -> list[Pack]:
        query = select(PackModel).order_by(PackModel.created_at.desc())
        if not include_inactive:
            query = query.where(PackModel.is_active == True)  # noqa: E712
        result = await self.session.execute(query)
        return [self._to_entity(p) for p in result.scalars()]

    async def update(self, pack: Pack) -> Pack:
        result = await self.session.execute(select(PackModel).where(PackModel.id == pack.id))
        db_pack = result.scalar_one_or_none()
        if not db_pack:
            raise ValueError(f"Pack {pack.id} not found")
        db_pack.nom = pack.nom
        db_pack.description = pack.description
        db_pack.zone_ids = pack.zone_ids
        db_pack.prix = pack.prix
        db_pack.duree_jours = pack.duree_jours
        db_pack.seances_per_zone = pack.seances_per_zone
        db_pack.is_active = pack.is_active
        await self.session.flush()
        return self._to_entity(db_pack)

    async def delete(self, pack_id: str) -> bool:
        result = await self.session.execute(select(PackModel).where(PackModel.id == pack_id))
        db_pack = result.scalar_one_or_none()
        if db_pack:
            db_pack.is_active = False
            await self.session.flush()
            return True
        return False

    def _to_entity(self, model: PackModel) -> Pack:
        return Pack(
            id=model.id,
            nom=model.nom,
            description=model.description,
            zone_ids=model.zone_ids or [],
            prix=model.prix,
            duree_jours=model.duree_jours,
            seances_per_zone=model.seances_per_zone,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class PatientSubscriptionRepository:
    """Repository for patient subscription operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, subscription: PatientSubscription) -> PatientSubscription:
        db_sub = PatientSubscriptionModel(
            id=subscription.id,
            patient_id=subscription.patient_id,
            pack_id=subscription.pack_id,
            type=subscription.type,
            date_debut=subscription.date_debut,
            date_fin=subscription.date_fin,
            is_active=subscription.is_active,
            montant_paye=subscription.montant_paye,
            notes=subscription.notes,
        )
        self.session.add(db_sub)
        await self.session.flush()
        return await self.find_by_id(db_sub.id)  # type: ignore

    async def find_by_id(self, subscription_id: str) -> PatientSubscription | None:
        result = await self.session.execute(
            select(PatientSubscriptionModel)
            .options(joinedload(PatientSubscriptionModel.pack))
            .where(PatientSubscriptionModel.id == subscription_id)
        )
        db_sub = result.unique().scalar_one_or_none()
        return self._to_entity(db_sub) if db_sub else None

    async def find_by_patient(self, patient_id: str) -> list[PatientSubscription]:
        result = await self.session.execute(
            select(PatientSubscriptionModel)
            .options(joinedload(PatientSubscriptionModel.pack))
            .where(PatientSubscriptionModel.patient_id == patient_id)
            .order_by(PatientSubscriptionModel.created_at.desc())
        )
        return [self._to_entity(s) for s in result.unique().scalars()]

    async def find_active_by_patient(self, patient_id: str) -> list[PatientSubscription]:
        result = await self.session.execute(
            select(PatientSubscriptionModel)
            .options(joinedload(PatientSubscriptionModel.pack))
            .where(
                PatientSubscriptionModel.patient_id == patient_id,
                PatientSubscriptionModel.is_active == True,  # noqa: E712
            )
            .order_by(PatientSubscriptionModel.created_at.desc())
        )
        return [self._to_entity(s) for s in result.unique().scalars()]

    def _to_entity(self, model: PatientSubscriptionModel) -> PatientSubscription:
        pack_nom = model.pack.nom if model.pack else None
        return PatientSubscription(
            id=model.id,
            patient_id=model.patient_id,
            pack_id=model.pack_id,
            type=model.type,
            date_debut=model.date_debut,
            date_fin=model.date_fin,
            is_active=model.is_active,
            montant_paye=model.montant_paye,
            notes=model.notes,
            pack_nom=pack_nom,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
