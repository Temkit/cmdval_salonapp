"""Base schema configuration."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AppBaseModel(BaseModel):
    """Base model with common configuration."""

    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )


class PaginatedResponse(AppBaseModel):
    """Generic paginated response."""

    total: int
    page: int
    size: int
    pages: int


class MessageResponse(AppBaseModel):
    """Simple message response."""

    message: str
