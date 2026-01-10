"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import Literal

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
    secret_key: str = "change-this-to-a-very-long-random-string-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    # File Storage
    photos_path: str = "./data/photos"
    max_photo_size_mb: int = 10
    photo_quality: int = 85

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Admin
    admin_username: str = "admin"
    admin_password: str = "admin123"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
