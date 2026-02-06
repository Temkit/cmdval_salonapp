"""FastAPI application entry point."""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from src.api.v1.router import router as api_router
from src.core.config import get_settings
from src.core.exceptions import register_exception_handlers
from src.core.logging import setup_logging
from src.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from src.core.rate_limit import RateLimitMiddleware
from src.domain.entities.role import DEFAULT_ROLE_PERMISSIONS, Permission
from src.infrastructure.database.connection import async_session_factory
from src.infrastructure.database.models import RoleModel

settings = get_settings()
logger = logging.getLogger(__name__)


async def _sync_role_permissions() -> None:
    """Ensure system roles in DB have latest permissions from code."""
    async with async_session_factory() as session:
        result = await session.execute(
            select(RoleModel).where(RoleModel.is_system == True)  # noqa: E712
        )
        roles = result.scalars().all()
        for role in roles:
            expected = DEFAULT_ROLE_PERMISSIONS.get(role.name)
            if expected is None:
                continue
            expected_values = sorted(p.value for p in expected)
            current_values = sorted(role.permissions or [])
            if current_values != expected_values:
                role.permissions = expected_values
                logger.info("Synced permissions for role '%s': added %s",
                            role.name,
                            set(expected_values) - set(current_values))
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    os.makedirs(settings.photos_path, exist_ok=True)
    await _sync_role_permissions()
    yield
    # Shutdown
    pass


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    setup_logging(debug=settings.debug, log_level=settings.log_level)

    app = FastAPI(
        title=settings.app_name,
        description="API de gestion de salon d'épilation laser",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/api/docs" if settings.debug else None,
        redoc_url="/api/redoc" if settings.debug else None,
        openapi_url="/api/openapi.json" if settings.debug else None,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
        max_age=600,
    )

    # Security headers (outermost — runs first on response)
    app.add_middleware(SecurityHeadersMiddleware)

    # Request logging
    app.add_middleware(RequestLoggingMiddleware)

    # Rate limiting
    app.add_middleware(RateLimitMiddleware)

    # Register exception handlers
    register_exception_handlers(app)

    # Include API router
    app.include_router(api_router)

    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "app": settings.app_name}

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8420,
        reload=settings.debug,
    )
