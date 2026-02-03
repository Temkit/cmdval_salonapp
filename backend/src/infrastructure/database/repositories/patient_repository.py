"""Patient repository implementation."""

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.patient import Patient
from src.domain.interfaces.patient_repository import PatientRepositoryInterface
from src.infrastructure.database.models import PatientModel


class PatientRepository(PatientRepositoryInterface):
    """Repository for patient operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, patient: Patient) -> Patient:
        """Create a new patient."""
        db_patient = PatientModel(
            id=patient.id,
            code_carte=patient.code_carte,
            nom=patient.nom,
            prenom=patient.prenom,
            date_naissance=patient.date_naissance,
            sexe=patient.sexe,
            telephone=patient.telephone,
            email=patient.email,
            adresse=patient.adresse,
            notes=patient.notes,
            phototype=patient.phototype,
            status=patient.status,
        )
        self.session.add(db_patient)
        await self.session.flush()
        return self._to_entity(db_patient)

    async def find_by_id(self, patient_id: str) -> Patient | None:
        """Find patient by ID."""
        result = await self.session.execute(
            select(PatientModel).where(PatientModel.id == patient_id)
        )
        db_patient = result.scalar_one_or_none()
        return self._to_entity(db_patient) if db_patient else None

    async def find_by_card_code(self, code: str) -> Patient | None:
        """Find patient by card code."""
        result = await self.session.execute(
            select(PatientModel).where(PatientModel.code_carte == code)
        )
        db_patient = result.scalar_one_or_none()
        return self._to_entity(db_patient) if db_patient else None

    async def search(
        self,
        query: str,
        page: int,
        size: int,
    ) -> tuple[list[Patient], int]:
        """Search patients by name, phone, or card code."""
        search_term = f"%{query}%"
        base_query = select(PatientModel).where(
            or_(
                PatientModel.nom.ilike(search_term),
                PatientModel.prenom.ilike(search_term),
                PatientModel.telephone.ilike(search_term),
                PatientModel.code_carte.ilike(search_term),
            )
        )

        # Count total
        count_result = await self.session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar() or 0

        # Get page
        result = await self.session.execute(
            base_query.order_by(PatientModel.nom, PatientModel.prenom)
            .offset((page - 1) * size)
            .limit(size)
        )
        patients = [self._to_entity(p) for p in result.scalars()]

        return patients, total

    async def find_all(
        self,
        page: int,
        size: int,
    ) -> tuple[list[Patient], int]:
        """Get all patients with pagination."""
        # Count total
        count_result = await self.session.execute(select(func.count(PatientModel.id)))
        total = count_result.scalar() or 0

        # Get page
        result = await self.session.execute(
            select(PatientModel)
            .order_by(PatientModel.nom, PatientModel.prenom)
            .offset((page - 1) * size)
            .limit(size)
        )
        patients = [self._to_entity(p) for p in result.scalars()]

        return patients, total

    async def update(self, patient: Patient) -> Patient:
        """Update patient."""
        result = await self.session.execute(
            select(PatientModel).where(PatientModel.id == patient.id)
        )
        db_patient = result.scalar_one_or_none()
        if db_patient:
            db_patient.nom = patient.nom
            db_patient.prenom = patient.prenom
            db_patient.date_naissance = patient.date_naissance
            db_patient.sexe = patient.sexe
            db_patient.telephone = patient.telephone
            db_patient.email = patient.email
            db_patient.adresse = patient.adresse
            db_patient.notes = patient.notes
            db_patient.phototype = patient.phototype
            db_patient.status = patient.status
            await self.session.flush()
            return self._to_entity(db_patient)
        raise ValueError(f"Patient {patient.id} not found")

    async def delete(self, patient_id: str) -> bool:
        """Delete patient."""
        result = await self.session.execute(
            select(PatientModel).where(PatientModel.id == patient_id)
        )
        db_patient = result.scalar_one_or_none()
        if db_patient:
            await self.session.delete(db_patient)
            await self.session.flush()
            return True
        return False

    async def count(self) -> int:
        """Count total patients."""
        result = await self.session.execute(select(func.count(PatientModel.id)))
        return result.scalar() or 0

    async def count_new_this_month(self) -> int:
        """Count patients created this month."""
        from datetime import UTC, datetime

        now = datetime.now(UTC)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = await self.session.execute(
            select(func.count(PatientModel.id)).where(PatientModel.created_at >= start_of_month)
        )
        return result.scalar() or 0

    def _to_entity(self, model: PatientModel) -> Patient:
        """Convert model to entity."""
        return Patient(
            id=model.id,
            code_carte=model.code_carte,
            nom=model.nom,
            prenom=model.prenom,
            date_naissance=model.date_naissance,
            sexe=model.sexe,
            telephone=model.telephone,
            email=model.email,
            adresse=model.adresse,
            ville=model.ville,
            code_postal=model.code_postal,
            notes=model.notes,
            phototype=model.phototype,
            status=model.status,
            created_by=model.created_by,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
