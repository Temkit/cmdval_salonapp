"""SQLAlchemy ORM models for all database tables."""

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.connection import Base

if TYPE_CHECKING:
    pass


class RoleModel(Base):
    """User roles with permissions."""

    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    permissions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    users: Mapped[list["UserModel"]] = relationship(back_populates="role")


class UserModel(Base):
    """System users (admin, secretaire, praticien)."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    prenom: Mapped[str] = mapped_column(String(100), nullable=False)
    role_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("roles.id"), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    role: Mapped["RoleModel"] = relationship(back_populates="users")


class PatientModel(Base):
    """Patient records with personal information."""

    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    code_carte: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    nom: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    prenom: Mapped[str] = mapped_column(String(100), nullable=False)
    date_naissance: Mapped[date] = mapped_column(Date, nullable=False)
    sexe: Mapped[str] = mapped_column(String(10), nullable=False)
    telephone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    adresse: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ville: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    code_postal: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    created_by: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    zones: Mapped[list["PatientZoneModel"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["SessionModel"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    questionnaire_responses: Mapped[list["QuestionResponseModel"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )


class ZoneDefinitionModel(Base):
    """Body zone definitions for treatments."""

    __tablename__ = "zone_definitions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )


class PatientZoneModel(Base):
    """Patient zone subscriptions with session counts."""

    __tablename__ = "patient_zones"
    __table_args__ = (
        UniqueConstraint("patient_id", "zone_id", name="uq_patient_zone"),
        CheckConstraint("seances_total >= 0", name="ck_seances_total_positive"),
        CheckConstraint("seances_used >= 0", name="ck_seances_used_positive"),
        CheckConstraint(
            "seances_used <= seances_total", name="ck_seances_used_not_exceed_total"
        ),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    patient_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    zone_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("zone_definitions.id"), nullable=False
    )
    seances_total: Mapped[int] = mapped_column(Integer, nullable=False)
    seances_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
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

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    ordre: Mapped[int] = mapped_column(Integer, nullable=False)
    texte: Mapped[str] = mapped_column(Text, nullable=False)
    type_reponse: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # text, boolean, choice, multiple_choice
    options: Mapped[Optional[dict]] = mapped_column(
        JSON, nullable=True
    )  # For choice types
    obligatoire: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class QuestionResponseModel(Base):
    """Patient responses to questionnaire questions."""

    __tablename__ = "question_responses"
    __table_args__ = (
        UniqueConstraint("patient_id", "question_id", name="uq_patient_question"),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    patient_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("questions.id"), nullable=False
    )
    reponse: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    patient: Mapped["PatientModel"] = relationship(
        back_populates="questionnaire_responses"
    )
    question: Mapped["QuestionModel"] = relationship()


class SessionModel(Base):
    """Treatment sessions (immutable once created)."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    patient_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    patient_zone_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("patient_zones.id"), nullable=False
    )
    praticien_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=False
    )
    type_laser: Mapped[str] = mapped_column(String(50), nullable=False)
    parametres: Mapped[dict] = mapped_column(JSON, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date_seance: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    duree_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

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

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    session: Mapped["SessionModel"] = relationship(back_populates="photos")
