"""Patient repository implementation."""

import re

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.patient import Patient
from src.domain.interfaces.patient_repository import PatientRepositoryInterface
from src.infrastructure.database.models import PatientModel, SessionModel


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
            commune=patient.commune,
            wilaya=patient.wilaya,
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

    async def find_by_phone(self, phone: str) -> list[Patient]:
        """Find patients by phone number (normalized digit comparison)."""
        digits = re.sub(r"\D", "", phone)
        if len(digits) < 6:
            return []
        # Use LIKE on last 8 digits for index-friendly filtering
        suffix = digits[-8:]
        result = await self.session.execute(
            select(PatientModel).where(
                PatientModel.telephone.isnot(None),
                PatientModel.telephone.ilike(f"%{suffix}%"),
            )
        )
        patients = []
        for p in result.scalars():
            if p.telephone:
                p_digits = re.sub(r"\D", "", p.telephone)
                if p_digits == digits or (len(p_digits) >= 8 and p_digits[-8:] == suffix):
                    patients.append(self._to_entity(p))
        return patients

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

    async def find_by_doctor(
        self,
        doctor_id: str,
        page: int,
        size: int,
        query: str | None = None,
    ) -> tuple[list[Patient], int]:
        """Find patients who had sessions with a specific doctor."""
        # Subquery: distinct patient IDs from sessions by this doctor
        doctor_patients = (
            select(SessionModel.patient_id)
            .where(SessionModel.praticien_id == doctor_id)
            .distinct()
            .subquery()
        )
        base_query = select(PatientModel).where(
            PatientModel.id.in_(select(doctor_patients.c.patient_id))
        )
        if query:
            search_term = f"%{query}%"
            base_query = base_query.where(
                or_(
                    PatientModel.nom.ilike(search_term),
                    PatientModel.prenom.ilike(search_term),
                    PatientModel.telephone.ilike(search_term),
                    PatientModel.code_carte.ilike(search_term),
                )
            )

        count_result = await self.session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar() or 0

        result = await self.session.execute(
            base_query.order_by(PatientModel.nom, PatientModel.prenom)
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
            db_patient.commune = patient.commune
            db_patient.wilaya = patient.wilaya
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

        now = datetime.now(UTC).replace(tzinfo=None)
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
            commune=model.commune,
            wilaya=model.wilaya,
            code_postal=model.code_postal,
            notes=model.notes,
            phototype=model.phototype,
            status=model.status,
            created_by=model.created_by,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
