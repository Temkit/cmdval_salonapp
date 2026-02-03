"""Box (treatment room) schemas."""

import datetime as dt

from pydantic import Field

from src.schemas.base import AppBaseModel


class BoxCreate(AppBaseModel):
    nom: str = Field(min_length=1, max_length=50)
    numero: int = Field(ge=1)


class BoxUpdate(AppBaseModel):
    nom: str | None = Field(default=None, min_length=1, max_length=50)
    numero: int | None = Field(default=None, ge=1)
    is_active: bool | None = None


class BoxResponse(AppBaseModel):
    id: str
    nom: str
    numero: int
    is_active: bool
    current_user_id: str | None = None
    current_user_name: str | None = None
    created_at: dt.datetime


class BoxListResponse(AppBaseModel):
    boxes: list[BoxResponse]


class BoxAssignRequest(AppBaseModel):
    box_id: str = Field(min_length=36, max_length=36)


class BoxAssignmentResponse(AppBaseModel):
    box_id: str
    box_nom: str
    user_id: str
    user_nom: str
    assigned_at: dt.datetime
