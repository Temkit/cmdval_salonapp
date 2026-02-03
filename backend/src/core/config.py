"""Application configuration using Pydantic Settings."""

import secrets
import warnings
from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "SalonApp"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: Literal["development", "staging", "production"] = "development"

    # Database
    database_url: str = "postgresql+asyncpg://salonapp:salonapp@localhost:5432/salonapp"

    # Security
    secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    # File Storage
    photos_path: str = "./data/photos"
    max_photo_size_mb: int = 10
    photo_quality: int = 85

    # CORS
    cors_origins: list[str] = ["http://localhost:3420"]

    # Admin
    admin_username: str | None = None
    admin_password: str | None = None

    # Logging
    log_level: str = "INFO"

    # Rate limiting
    rate_limit_per_minute: int = 60
    rate_limit_login_per_minute: int = 5

    @model_validator(mode="after")
    def validate_settings(self) -> "Settings":
        if self.environment == "production":
            if not self.secret_key:
                raise ValueError("SECRET_KEY must be set in production")
            if self.debug:
                raise ValueError("DEBUG must be False in production")
        elif not self.secret_key:
            self.secret_key = secrets.token_urlsafe(32)
            warnings.warn(
                "SECRET_KEY not set — using random key. Sessions will not survive restarts.",
                UserWarning,
                stacklevel=2,
            )
        return self


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
