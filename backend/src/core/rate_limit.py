"""In-memory sliding window rate limiter."""

import time
from collections import defaultdict

import structlog
from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from src.core.config import settings

logger = structlog.get_logger()

# Stores: {key: [timestamp, timestamp, ...]}
_request_log: dict[str, list[float]] = defaultdict(list)


def _cleanup(key: str, window: float, now: float) -> list[float]:
    """Remove timestamps outside the sliding window."""
    cutoff = now - window
    _request_log[key] = [t for t in _request_log[key] if t > cutoff]
    return _request_log[key]


def _check_rate(key: str, limit: int, window: float = 60.0) -> int | None:
    """Check rate limit. Returns seconds until reset if exceeded, None otherwise."""
    now = time.monotonic()
    timestamps = _cleanup(key, window, now)
    if len(timestamps) >= limit:
        oldest = timestamps[0]
        retry_after = int(oldest + window - now) + 1
        return retry_after
    _request_log[key].append(now)
    return None


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """General rate limiter for all routes."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        ip = _client_ip(request)
        key = f"global:{ip}"
        retry_after = _check_rate(key, settings.rate_limit_per_minute)
        if retry_after is not None:
            await logger.warning("rate_limit_exceeded", client=ip, path=request.url.path)
            return Response(
                content='{"detail":"Trop de requêtes. Veuillez réessayer."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)


async def rate_limit_login(request: Request) -> None:
    """Stricter rate limiter dependency for login endpoint."""
    ip = _client_ip(request)
    key = f"login:{ip}"
    retry_after = _check_rate(key, settings.rate_limit_login_per_minute)
    if retry_after is not None:
        await logger.warning("login_rate_limit_exceeded", client=ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Trop de tentatives de connexion. Veuillez réessayer.",
            headers={"Retry-After": str(retry_after)},
        )
