"""Pre-consultation repository implementation."""

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.entities.pre_consultation import PreConsultation, PreConsultationZone
from src.infrastructure.database.models import (
    PatientModel,
    PreConsultationModel,
    PreConsultationZoneModel,
)


class PreConsultationRepository:
    """Repository for pre-consultation operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, pre_consultation: PreConsultation) -> PreConsultation:
        """Create a new pre-consultation."""
        db_pre_consultation = PreConsultationModel(
            id=pre_consultation.id,
            patient_id=pre_consultation.patient_id,
            sexe=pre_consultation.sexe,
            age=pre_consultation.age,
            date_naissance=pre_consultation.date_naissance,
            statut_marital=pre_consultation.statut_marital,
            is_pregnant=pre_consultation.is_pregnant,
            is_breastfeeding=pre_consultation.is_breastfeeding,
            pregnancy_planning=pre_consultation.pregnancy_planning,
            has_previous_laser=pre_consultation.has_previous_laser,
            previous_laser_clarity_ii=pre_consultation.previous_laser_clarity_ii,
            previous_laser_sessions=pre_consultation.previous_laser_sessions,
            previous_laser_brand=pre_consultation.previous_laser_brand,
            hair_removal_methods=pre_consultation.hair_removal_methods,
            last_hair_removal_date=pre_consultation.last_hair_removal_date,
            medical_history=pre_consultation.medical_history,
            dermatological_conditions=pre_consultation.dermatological_conditions,
            has_current_treatments=pre_consultation.has_current_treatments,
            current_treatments_details=pre_consultation.current_treatments_details,
            has_moles=pre_consultation.has_moles,
            moles_location=pre_consultation.moles_location,
            has_birthmarks=pre_consultation.has_birthmarks,
            birthmarks_location=pre_consultation.birthmarks_location,
            contraception_method=pre_consultation.contraception_method,
            hormonal_disease_2years=pre_consultation.hormonal_disease_2years,
            recent_peeling=pre_consultation.recent_peeling,
            recent_peeling_date=pre_consultation.recent_peeling_date,
            peeling_zone=pre_consultation.peeling_zone,
            last_laser_date=pre_consultation.last_laser_date,
            phototype=pre_consultation.phototype,
            notes=pre_consultation.notes,
            status=pre_consultation.status,
            created_by=pre_consultation.created_by,
            validated_by=pre_consultation.validated_by,
            validated_at=pre_consultation.validated_at,
            rejection_reason=pre_consultation.rejection_reason,
        )
        self.session.add(db_pre_consultation)
        await self.session.flush()

        # Create zones
        for zone in pre_consultation.zones:
            db_zone = PreConsultationZoneModel(
                id=zone.id,
                pre_consultation_id=pre_consultation.id,
                zone_id=zone.zone_id,
                is_eligible=zone.is_eligible,
                observations=zone.observations,
            )
            self.session.add(db_zone)

        await self.session.flush()
        return await self.find_by_id(pre_consultation.id)

    async def find_by_id(self, pre_consultation_id: str) -> PreConsultation | None:
        """Find pre-consultation by ID with all relationships."""
        result = await self.session.execute(
            select(PreConsultationModel)
            .options(
                selectinload(PreConsultationModel.zones).selectinload(
                    PreConsultationZoneModel.zone
                ),
                selectinload(PreConsultationModel.creator),
                selectinload(PreConsultationModel.validator),
                selectinload(PreConsultationModel.patient),
            )
            .where(PreConsultationModel.id == pre_consultation_id)
        )
        db_pre_consultation = result.scalar_one_or_none()
        return self._to_entity(db_pre_consultation) if db_pre_consultation else None

    async def find_by_patient_id(self, patient_id: str) -> PreConsultation | None:
        """Find pre-consultation by patient ID."""
        result = await self.session.execute(
            select(PreConsultationModel)
            .options(
                selectinload(PreConsultationModel.zones).selectinload(
                    PreConsultationZoneModel.zone
                ),
                selectinload(PreConsultationModel.patient),
            )
            .where(PreConsultationModel.patient_id == patient_id)
            .order_by(PreConsultationModel.created_at.desc())
        )
        db_pre_consultation = result.scalars().first()
        return self._to_entity(db_pre_consultation) if db_pre_consultation else None

    async def find_all(
        self,
        page: int,
        size: int,
        status: str | None = None,
        search: str | None = None,
    ) -> tuple[list[PreConsultation], int]:
        """Get all pre-consultations with pagination and filters."""
        base_query = select(PreConsultationModel).options(
            selectinload(PreConsultationModel.zones).selectinload(PreConsultationZoneModel.zone),
            selectinload(PreConsultationModel.creator),
            selectinload(PreConsultationModel.patient),
        )

        # Apply filters
        if status:
            base_query = base_query.where(PreConsultationModel.status == status)

        if search:
            search_term = f"%{search}%"
            # Search by patient name or notes (patient may not be linked yet)
            base_query = base_query.outerjoin(
                PatientModel, PreConsultationModel.patient_id == PatientModel.id
            ).where(
                or_(
                    PatientModel.nom.ilike(search_term),
                    PatientModel.prenom.ilike(search_term),
                    PatientModel.telephone.ilike(search_term),
                    PreConsultationModel.notes.ilike(search_term),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(
            base_query.with_only_columns(PreConsultationModel.id).subquery()
        )
        count_result = await self.session.execute(count_query)
        total = count_result.scalar() or 0

        # Get page
        result = await self.session.execute(
            base_query.order_by(PreConsultationModel.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        pre_consultations = [self._to_entity(p) for p in result.scalars()]

        return pre_consultations, total

    async def update(self, pre_consultation: PreConsultation) -> PreConsultation:
        """Update pre-consultation."""
        result = await self.session.execute(
            select(PreConsultationModel).where(PreConsultationModel.id == pre_consultation.id)
        )
        db_pre_consultation = result.scalar_one_or_none()
        if not db_pre_consultation:
            raise ValueError(f"PreConsultation {pre_consultation.id} not found")

        # Update all fields
        db_pre_consultation.patient_id = pre_consultation.patient_id
        db_pre_consultation.sexe = pre_consultation.sexe
        db_pre_consultation.age = pre_consultation.age
        db_pre_consultation.date_naissance = pre_consultation.date_naissance
        db_pre_consultation.statut_marital = pre_consultation.statut_marital
        db_pre_consultation.is_pregnant = pre_consultation.is_pregnant
        db_pre_consultation.is_breastfeeding = pre_consultation.is_breastfeeding
        db_pre_consultation.pregnancy_planning = pre_consultation.pregnancy_planning
        db_pre_consultation.has_previous_laser = pre_consultation.has_previous_laser
        db_pre_consultation.previous_laser_clarity_ii = pre_consultation.previous_laser_clarity_ii
        db_pre_consultation.previous_laser_sessions = pre_consultation.previous_laser_sessions
        db_pre_consultation.previous_laser_brand = pre_consultation.previous_laser_brand
        db_pre_consultation.hair_removal_methods = pre_consultation.hair_removal_methods
        db_pre_consultation.last_hair_removal_date = pre_consultation.last_hair_removal_date
        db_pre_consultation.medical_history = pre_consultation.medical_history
        db_pre_consultation.dermatological_conditions = pre_consultation.dermatological_conditions
        db_pre_consultation.has_current_treatments = pre_consultation.has_current_treatments
        db_pre_consultation.current_treatments_details = pre_consultation.current_treatments_details
        db_pre_consultation.has_moles = pre_consultation.has_moles
        db_pre_consultation.moles_location = pre_consultation.moles_location
        db_pre_consultation.has_birthmarks = pre_consultation.has_birthmarks
        db_pre_consultation.birthmarks_location = pre_consultation.birthmarks_location
        db_pre_consultation.contraception_method = pre_consultation.contraception_method
        db_pre_consultation.hormonal_disease_2years = pre_consultation.hormonal_disease_2years
        db_pre_consultation.recent_peeling = pre_consultation.recent_peeling
        db_pre_consultation.recent_peeling_date = pre_consultation.recent_peeling_date
        db_pre_consultation.peeling_zone = pre_consultation.peeling_zone
        db_pre_consultation.last_laser_date = pre_consultation.last_laser_date
        db_pre_consultation.phototype = pre_consultation.phototype
        db_pre_consultation.notes = pre_consultation.notes
        db_pre_consultation.status = pre_consultation.status
        db_pre_consultation.validated_by = pre_consultation.validated_by
        db_pre_consultation.validated_at = pre_consultation.validated_at
        db_pre_consultation.rejection_reason = pre_consultation.rejection_reason

        await self.session.flush()
        return await self.find_by_id(pre_consultation.id)

    async def delete(self, pre_consultation_id: str) -> bool:
        """Delete pre-consultation."""
        result = await self.session.execute(
            select(PreConsultationModel).where(PreConsultationModel.id == pre_consultation_id)
        )
        db_pre_consultation = result.scalar_one_or_none()
        if db_pre_consultation:
            await self.session.delete(db_pre_consultation)
            await self.session.flush()
            return True
        return False

    async def add_zone(
        self, pre_consultation_id: str, zone: PreConsultationZone
    ) -> PreConsultationZone:
        """Add zone eligibility to pre-consultation."""
        db_zone = PreConsultationZoneModel(
            id=zone.id,
            pre_consultation_id=pre_consultation_id,
            zone_id=zone.zone_id,
            is_eligible=zone.is_eligible,
            observations=zone.observations,
        )
        self.session.add(db_zone)
        await self.session.flush()

        # Reload with zone definition
        result = await self.session.execute(
            select(PreConsultationZoneModel)
            .options(selectinload(PreConsultationZoneModel.zone))
            .where(PreConsultationZoneModel.id == zone.id)
        )
        db_zone = result.scalar_one()
        return self._zone_to_entity(db_zone)

    async def update_zone(
        self, pre_consultation_id: str, zone_id: str, is_eligible: bool, observations: str | None
    ) -> PreConsultationZone | None:
        """Update zone eligibility."""
        result = await self.session.execute(
            select(PreConsultationZoneModel)
            .options(selectinload(PreConsultationZoneModel.zone))
            .where(
                PreConsultationZoneModel.pre_consultation_id == pre_consultation_id,
                PreConsultationZoneModel.zone_id == zone_id,
            )
        )
        db_zone = result.scalar_one_or_none()
        if not db_zone:
            return None

        db_zone.is_eligible = is_eligible
        db_zone.observations = observations
        await self.session.flush()
        return self._zone_to_entity(db_zone)

    async def delete_zone(self, pre_consultation_id: str, zone_id: str) -> bool:
        """Delete zone eligibility."""
        result = await self.session.execute(
            select(PreConsultationZoneModel).where(
                PreConsultationZoneModel.pre_consultation_id == pre_consultation_id,
                PreConsultationZoneModel.zone_id == zone_id,
            )
        )
        db_zone = result.scalar_one_or_none()
        if db_zone:
            await self.session.delete(db_zone)
            await self.session.flush()
            return True
        return False

    async def count_by_status(self, status: str) -> int:
        """Count pre-consultations by status."""
        result = await self.session.execute(
            select(func.count(PreConsultationModel.id)).where(PreConsultationModel.status == status)
        )
        return result.scalar() or 0

    def _to_entity(self, model: PreConsultationModel) -> PreConsultation:
        """Convert model to entity."""
        zones = [self._zone_to_entity(z) for z in model.zones] if model.zones else []

        creator_name = None
        if model.creator:
            creator_name = f"{model.creator.prenom} {model.creator.nom}"

        validator_name = None
        if model.validator:
            validator_name = f"{model.validator.prenom} {model.validator.nom}"

        # Patient info (always present now)
        patient_nom = None
        patient_prenom = None
        patient_code_carte = None
        patient_telephone = None
        if model.patient:
            patient_nom = model.patient.nom
            patient_prenom = model.patient.prenom
            patient_code_carte = model.patient.code_carte
            patient_telephone = model.patient.telephone

        return PreConsultation(
            id=model.id,
            patient_id=model.patient_id,
            patient_nom=patient_nom,
            patient_prenom=patient_prenom,
            patient_code_carte=patient_code_carte,
            patient_telephone=patient_telephone,
            sexe=model.sexe,
            age=model.age,
            date_naissance=model.date_naissance,
            statut_marital=model.statut_marital,
            is_pregnant=model.is_pregnant,
            is_breastfeeding=model.is_breastfeeding,
            pregnancy_planning=model.pregnancy_planning,
            has_previous_laser=model.has_previous_laser,
            previous_laser_clarity_ii=model.previous_laser_clarity_ii,
            previous_laser_sessions=model.previous_laser_sessions,
            previous_laser_brand=model.previous_laser_brand,
            hair_removal_methods=model.hair_removal_methods or [],
            last_hair_removal_date=model.last_hair_removal_date,
            medical_history=model.medical_history or {},
            dermatological_conditions=model.dermatological_conditions or [],
            has_current_treatments=model.has_current_treatments,
            current_treatments_details=model.current_treatments_details,
            has_moles=model.has_moles,
            moles_location=model.moles_location,
            has_birthmarks=model.has_birthmarks,
            birthmarks_location=model.birthmarks_location,
            contraception_method=model.contraception_method,
            hormonal_disease_2years=model.hormonal_disease_2years,
            recent_peeling=model.recent_peeling,
            recent_peeling_date=model.recent_peeling_date,
            peeling_zone=model.peeling_zone,
            last_laser_date=model.last_laser_date,
            phototype=model.phototype,
            notes=model.notes,
            status=model.status,
            zones=zones,
            created_by=model.created_by,
            created_by_name=creator_name,
            validated_by=model.validated_by,
            validated_by_name=validator_name,
            validated_at=model.validated_at,
            rejection_reason=model.rejection_reason,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _zone_to_entity(self, model: PreConsultationZoneModel) -> PreConsultationZone:
        """Convert zone model to entity."""
        return PreConsultationZone(
            id=model.id,
            zone_id=model.zone_id,
            is_eligible=model.is_eligible,
            observations=model.observations,
            zone_nom=model.zone.nom if model.zone else None,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
