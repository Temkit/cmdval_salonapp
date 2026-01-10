"""API v1 router."""

from fastapi import APIRouter

from src.api.v1.endpoints import (
    auth,
    dashboard,
    patients,
    questionnaire,
    roles,
    sessions,
    users,
    zones,
)

router = APIRouter(prefix="/api/v1")

# Include all endpoint routers
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(roles.router)
router.include_router(patients.router)
router.include_router(zones.router)
router.include_router(questionnaire.router)
router.include_router(sessions.router)
router.include_router(dashboard.router)
