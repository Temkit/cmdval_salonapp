"""SQLAlchemy ORM models for all database tables."""

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.connection import Base

if TYPE_CHECKING:
    pass


class RoleModel(Base):
    """User roles with permissions."""

    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    permissions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    users: Mapped[list["UserModel"]] = relationship(back_populates="role")


class UserModel(Base):
    """System users (admin, secretaire, praticien)."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    prenom: Mapped[str] = mapped_column(String(100), nullable=False)
    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("roles.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    role: Mapped["RoleModel"] = relationship(back_populates="users")


class PatientModel(Base):
    """Patient records with personal information."""

    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    code_carte: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    nom: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    prenom: Mapped[str] = mapped_column(String(100), nullable=False)
    date_naissance: Mapped[date | None] = mapped_column(Date, nullable=True)
    sexe: Mapped[str | None] = mapped_column(String(10), nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    adresse: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ville: Mapped[str | None] = mapped_column(String(100), nullable=True)
    code_postal: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    phototype: Mapped[str | None] = mapped_column(String(10), nullable=True)
    # Workflow status: en_attente_evaluation, actif, ineligible
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="actif")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )

    # Relationships
    zones: Mapped[list["PatientZoneModel"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["SessionModel"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    pre_consultations: Mapped[list["PreConsultationModel"]] = relationship(back_populates="patient")
    subscriptions: Mapped[list["PatientSubscriptionModel"]] = relationship(back_populates="patient")
    paiements: Mapped[list["PaiementModel"]] = relationship(back_populates="patient")


class ZoneDefinitionModel(Base):
    """Body zone definitions for treatments."""

    __tablename__ = "zone_definitions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    prix: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duree_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    categorie: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_homme: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class PatientZoneModel(Base):
    """Patient zone subscriptions with session counts."""

    __tablename__ = "patient_zones"
    __table_args__ = (
        UniqueConstraint("patient_id", "zone_id", name="uq_patient_zone"),
        CheckConstraint("seances_total >= 0", name="ck_seances_total_positive"),
        CheckConstraint("seances_used >= 0", name="ck_seances_used_positive"),
        CheckConstraint("seances_used <= seances_total", name="ck_seances_used_not_exceed_total"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    patient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    zone_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("zone_definitions.id"), nullable=False
    )
    seances_total: Mapped[int] = mapped_column(Integer, nullable=False)
    seances_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    patient: Mapped["PatientModel"] = relationship(back_populates="zones")
    zone: Mapped["ZoneDefinitionModel"] = relationship()

    @property
    def seances_restantes(self) -> int:
        """Calculate remaining sessions."""
        return self.seances_total - self.seances_used


class QuestionModel(Base):
    """Questionnaire questions configuration."""

    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    ordre: Mapped[int] = mapped_column(Integer, nullable=False)
    texte: Mapped[str] = mapped_column(Text, nullable=False)
    type_reponse: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # text, boolean, choice, multiple_choice
    options: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # For choice types
    obligatoire: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class QuestionResponseModel(Base):
    """Pre-consultation responses to questionnaire questions."""

    __tablename__ = "question_responses"
    __table_args__ = (
        UniqueConstraint("pre_consultation_id", "question_id", name="uq_preconsult_question"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    pre_consultation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("pre_consultations.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_id: Mapped[str] = mapped_column(String(36), ForeignKey("questions.id"), nullable=False)
    reponse: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    pre_consultation: Mapped["PreConsultationModel"] = relationship(
        back_populates="questionnaire_responses"
    )
    question: Mapped["QuestionModel"] = relationship()


class SessionModel(Base):
    """Treatment sessions (immutable once created)."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    patient_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    patient_zone_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient_zones.id"), nullable=False
    )
    praticien_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    type_laser: Mapped[str] = mapped_column(String(50), nullable=False)
    parametres: Mapped[dict] = mapped_column(JSON, nullable=False)
    spot_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fluence: Mapped[float | None] = mapped_column(Float, nullable=True)
    pulse_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    frequency_hz: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    date_seance: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    duree_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    patient: Mapped["PatientModel"] = relationship(back_populates="sessions")
    patient_zone: Mapped["PatientZoneModel"] = relationship()
    praticien: Mapped["UserModel"] = relationship()
    photos: Mapped[list["SessionPhotoModel"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class SessionPhotoModel(Base):
    """Photos attached to treatment sessions."""

    __tablename__ = "session_photos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    session: Mapped["SessionModel"] = relationship(back_populates="photos")


class PreConsultationModel(Base):
    """Pre-consultation for eligibility assessment (medical evaluation only)."""

    __tablename__ = "pre_consultations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )

    # Demographics (medical evaluation - no personal identification info)
    sexe: Mapped[str] = mapped_column(String(1), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    statut_marital: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Contraindications
    is_pregnant: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_breastfeeding: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pregnancy_planning: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Previous laser history
    has_previous_laser: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    previous_laser_clarity_ii: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    previous_laser_sessions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    previous_laser_brand: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Hair removal methods (JSON array)
    hair_removal_methods: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    # Medical history
    medical_history: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    dermatological_conditions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    has_current_treatments: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    current_treatments_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Skin conditions
    has_moles: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    moles_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    has_birthmarks: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    birthmarks_location: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Contraception and hormonal
    contraception_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hormonal_disease_2years: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Hair removal dates
    last_hair_removal_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_laser_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Peeling
    recent_peeling: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    recent_peeling_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    peeling_zone: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Phototype
    phototype: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Workflow status: draft, pending_validation, validated, patient_created, rejected
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="draft")

    # Audit
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    validated_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    validated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    zones: Mapped[list["PreConsultationZoneModel"]] = relationship(
        back_populates="pre_consultation", cascade="all, delete-orphan"
    )
    questionnaire_responses: Mapped[list["QuestionResponseModel"]] = relationship(
        back_populates="pre_consultation", cascade="all, delete-orphan"
    )
    patient: Mapped["PatientModel"] = relationship(back_populates="pre_consultations")
    creator: Mapped[Optional["UserModel"]] = relationship(foreign_keys=[created_by])
    validator: Mapped[Optional["UserModel"]] = relationship(foreign_keys=[validated_by])

    @property
    def has_contraindications(self) -> bool:
        """Check if patient has any contraindications."""
        return self.is_pregnant or self.is_breastfeeding or self.pregnancy_planning


class PreConsultationZoneModel(Base):
    """Zone eligibility for pre-consultation."""

    __tablename__ = "pre_consultation_zones"
    __table_args__ = (
        UniqueConstraint("pre_consultation_id", "zone_id", name="uq_pre_consultation_zone"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    pre_consultation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("pre_consultations.id", ondelete="CASCADE"),
        nullable=False,
    )
    zone_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("zone_definitions.id"), nullable=False
    )
    is_eligible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    pre_consultation: Mapped["PreConsultationModel"] = relationship(back_populates="zones")
    zone: Mapped["ZoneDefinitionModel"] = relationship()


class SessionSideEffectModel(Base):
    """Side effects recorded during sessions."""

    __tablename__ = "session_side_effects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    session: Mapped["SessionModel"] = relationship()
    photos: Mapped[list["SideEffectPhotoModel"]] = relationship(
        back_populates="side_effect", cascade="all, delete-orphan"
    )


class SideEffectPhotoModel(Base):
    """Photos attached to side effects."""

    __tablename__ = "side_effect_photos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    side_effect_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("session_side_effects.id", ondelete="CASCADE"),
        nullable=False,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    side_effect: Mapped["SessionSideEffectModel"] = relationship(back_populates="photos")


class PackModel(Base):
    """Subscription packs (Gold, custom packs)."""

    __tablename__ = "packs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    zone_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    prix: Mapped[int] = mapped_column(Integer, nullable=False)
    duree_jours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seances_per_zone: Mapped[int] = mapped_column(Integer, nullable=False, default=6)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    subscriptions: Mapped[list["PatientSubscriptionModel"]] = relationship(back_populates="pack")


class PatientSubscriptionModel(Base):
    """Patient subscriptions (Gold, pack, per-session)."""

    __tablename__ = "patient_subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    pack_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("packs.id"), nullable=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # gold, pack, seance
    date_debut: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    montant_paye: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    patient: Mapped["PatientModel"] = relationship(back_populates="subscriptions")
    pack: Mapped[Optional["PackModel"]] = relationship(back_populates="subscriptions")


class PaiementModel(Base):
    """Payment records."""

    __tablename__ = "paiements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    subscription_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("patient_subscriptions.id"), nullable=True
    )
    session_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("sessions.id"), nullable=True
    )
    montant: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # encaissement, prise_en_charge, hors_carte
    mode_paiement: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # especes, carte, virement
    reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    date_paiement: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    patient: Mapped["PatientModel"] = relationship(back_populates="paiements")


class PromotionModel(Base):
    """Promotions and discounts."""

    __tablename__ = "promotions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # pourcentage, montant
    valeur: Mapped[float] = mapped_column(Float, nullable=False)
    zone_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    date_debut: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class DailyScheduleModel(Base):
    """Daily schedule entries from Excel upload."""

    __tablename__ = "daily_schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    patient_nom: Mapped[str] = mapped_column(String(100), nullable=False)
    patient_prenom: Mapped[str] = mapped_column(String(100), nullable=False)
    patient_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=True
    )
    doctor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    doctor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    specialite: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    start_time: Mapped[datetime] = mapped_column(Time, nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(Time, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="expected"
    )  # expected, checked_in, in_treatment, completed, no_show
    uploaded_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class WaitingQueueModel(Base):
    """Virtual waiting queue entries."""

    __tablename__ = "waiting_queue"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    schedule_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("daily_schedules.id"), nullable=True
    )
    patient_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=True
    )
    patient_name: Mapped[str] = mapped_column(String(200), nullable=False)
    doctor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    doctor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="waiting"
    )  # waiting, in_treatment, done
    called_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
