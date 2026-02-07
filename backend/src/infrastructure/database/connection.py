"""Database connection and session management."""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings

# Create async engine with appropriate settings for database type
_engine_kwargs = {
    "echo": settings.debug,
}

# SQLite doesn't support connection pooling the same way as PostgreSQL
if settings.database_url.startswith("sqlite"):
    # SQLite uses StaticPool for async support
    from sqlalchemy.pool import StaticPool

    _engine_kwargs["poolclass"] = StaticPool
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL supports connection pooling
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_size"] = 5
    _engine_kwargs["max_overflow"] = 10

engine = create_async_engine(settings.database_url, **_engine_kwargs)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""

    pass


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide database session with automatic commit/rollback."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Type alias for dependency injection
DBSession = Annotated[AsyncSession, Depends(get_db_session)]

# Alias for backwards compatibility
get_session = get_db_session
