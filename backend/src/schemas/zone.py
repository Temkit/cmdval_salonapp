"""Zone schemas."""

from datetime import datetime

from pydantic import Field

from src.schemas.base import AppBaseModel


# Zone Definition schemas
class ZoneDefinitionBase(AppBaseModel):
    """Base zone definition schema."""

    code: str = Field(min_length=1, max_length=30)
    nom: str = Field(min_length=1, max_length=100)
    description: str | None = None
    ordre: int = Field(default=0, ge=0)


class ZoneDefinitionCreate(ZoneDefinitionBase):
    """Zone definition creation schema."""

    pass


class ZoneDefinitionUpdate(AppBaseModel):
    """Zone definition update schema."""

    nom: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    ordre: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ZoneDefinitionResponse(ZoneDefinitionBase):
    """Zone definition response schema."""

    id: str
    is_active: bool
    created_at: datetime


class ZoneDefinitionListResponse(AppBaseModel):
    """Zone definition list response."""

    zones: list[ZoneDefinitionResponse]


# Patient Zone schemas
class PatientZoneBase(AppBaseModel):
    """Base patient zone schema."""

    zone_definition_id: str
    seances_prevues: int = Field(default=6, ge=1, le=50)
    notes: str | None = None


class PatientZoneCreate(PatientZoneBase):
    """Patient zone creation schema."""

    pass


class PatientZoneUpdate(AppBaseModel):
    """Patient zone update schema."""

    seances_prevues: int | None = Field(default=None, ge=1, le=50)
    notes: str | None = None


class PatientZoneResponse(AppBaseModel):
    """Patient zone response schema."""

    id: str
    patient_id: str
    zone_definition_id: str
    zone_nom: str
    seances_prevues: int
    seances_effectuees: int
    seances_restantes: int
    progression: float
    notes: str | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_entity(cls, zone) -> "PatientZoneResponse":
        """Create response from PatientZone entity."""
        seances_prevues = zone.seances_total
        seances_effectuees = zone.seances_used
        seances_restantes = seances_prevues - seances_effectuees
        progression = (seances_effectuees / seances_prevues * 100) if seances_prevues > 0 else 0
        return cls(
            id=zone.id,
            patient_id=zone.patient_id,
            zone_definition_id=zone.zone_id,
            zone_nom=zone.zone_nom,
            seances_prevues=seances_prevues,
            seances_effectuees=seances_effectuees,
            seances_restantes=seances_restantes,
            progression=round(progression, 1),
            notes=zone.notes,
            created_at=zone.created_at,
            updated_at=zone.updated_at,
        )


class PatientZoneListResponse(AppBaseModel):
    """Patient zone list response."""

    zones: list[PatientZoneResponse]
