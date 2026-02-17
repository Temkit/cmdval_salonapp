"""Patient service."""

from datetime import date
from uuid import uuid4

from src.domain.entities.patient import Patient
from src.domain.exceptions import DuplicateCardCodeError, PatientNotFoundError
from src.infrastructure.database.repositories import PatientRepository


class PatientService:
    """Service for patient operations."""

    def __init__(self, patient_repository: PatientRepository):
        self.patient_repository = patient_repository

    async def create_patient(
        self,
        nom: str,
        prenom: str,
        code_carte: str | None = None,
        date_naissance: date | None = None,
        sexe: str | None = None,
        telephone: str | None = None,
        email: str | None = None,
        adresse: str | None = None,
        commune: str | None = None,
        wilaya: str | None = None,
        notes: str | None = None,
        phototype: str | None = None,
        status: str = "actif",
    ) -> Patient:
        """Create a new patient."""
        # Auto-generate card code if not provided
        if not code_carte:
            code_carte = f"P-{uuid4().hex[:8].upper()}"

        # Check if card code already exists
        existing = await self.patient_repository.find_by_card_code(code_carte)
        if existing:
            raise DuplicateCardCodeError(code_carte)

        patient = Patient(
            code_carte=code_carte,
            nom=nom,
            prenom=prenom,
            date_naissance=date_naissance,
            sexe=sexe,
            telephone=telephone,
            email=email,
            adresse=adresse,
            commune=commune,
            wilaya=wilaya,
            notes=notes,
            phototype=phototype,
            status=status,
        )

        return await self.patient_repository.create(patient)

    async def get_patient(self, patient_id: str) -> Patient:
        """Get patient by ID."""
        patient = await self.patient_repository.find_by_id(patient_id)
        if not patient:
            raise PatientNotFoundError(patient_id)
        return patient

    async def get_patient_by_card(self, code_carte: str) -> Patient:
        """Get patient by card code."""
        patient = await self.patient_repository.find_by_card_code(code_carte)
        if not patient:
            raise PatientNotFoundError(code_carte)
        return patient

    async def search_patients(
        self,
        query: str,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Patient], int]:
        """Search patients."""
        return await self.patient_repository.search(query, page, size)

    async def get_all_patients(
        self,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Patient], int]:
        """Get all patients with pagination."""
        return await self.patient_repository.find_all(page, size)

    async def get_doctor_patients(
        self,
        doctor_id: str,
        page: int = 1,
        size: int = 20,
        q: str | None = None,
    ) -> tuple[list[Patient], int]:
        """Get patients who had sessions with a specific doctor."""
        return await self.patient_repository.find_by_doctor(doctor_id, page, size, q)

    async def update_patient(
        self,
        patient_id: str,
        nom: str | None = None,
        prenom: str | None = None,
        date_naissance: date | None = None,
        sexe: str | None = None,
        telephone: str | None = None,
        email: str | None = None,
        adresse: str | None = None,
        commune: str | None = None,
        wilaya: str | None = None,
        notes: str | None = None,
        phototype: str | None = None,
        status: str | None = None,
    ) -> Patient:
        """Update patient."""
        patient = await self.patient_repository.find_by_id(patient_id)
        if not patient:
            raise PatientNotFoundError(patient_id)

        if nom:
            patient.nom = nom
        if prenom:
            patient.prenom = prenom
        if date_naissance is not None:
            patient.date_naissance = date_naissance
        if sexe is not None:
            patient.sexe = sexe
        if telephone is not None:
            patient.telephone = telephone
        if email is not None:
            patient.email = email
        if adresse is not None:
            patient.adresse = adresse
        if commune is not None:
            patient.commune = commune
        if wilaya is not None:
            patient.wilaya = wilaya
        if notes is not None:
            patient.notes = notes
        if phototype is not None:
            patient.phototype = phototype
        if status is not None:
            patient.status = status

        return await self.patient_repository.update(patient)

    async def delete_patient(self, patient_id: str) -> bool:
        """Delete patient."""
        patient = await self.patient_repository.find_by_id(patient_id)
        if not patient:
            raise PatientNotFoundError(patient_id)
        return await self.patient_repository.delete(patient_id)

    async def count_patients(self) -> int:
        """Count total patients."""
        return await self.patient_repository.count()

    async def count_new_this_month(self) -> int:
        """Count new patients this month."""
        return await self.patient_repository.count_new_this_month()
