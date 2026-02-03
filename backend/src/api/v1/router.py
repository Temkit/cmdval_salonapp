"""API v1 router."""

from fastapi import APIRouter

from src.api.v1.endpoints import (
    alerts,
    auth,
    boxes,
    dashboard,
    documents,
    packs,
    paiements,
    patients,
    pre_consultations,
    promotions,
    questionnaire,
    roles,
    schedule,
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
router.include_router(pre_consultations.router)
router.include_router(alerts.router)
router.include_router(packs.router)
router.include_router(paiements.router)
router.include_router(promotions.router)
router.include_router(schedule.router)
router.include_router(boxes.router)
router.include_router(documents.router)
