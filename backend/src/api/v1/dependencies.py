"""API dependencies for dependency injection."""

from typing import Annotated, Optional

import jwt as pyjwt
from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.services import (
    AuthService,
    DashboardService,
    PatientService,
    PatientZoneService,
    QuestionnaireService,
    QuestionService,
    RoleService,
    SessionService,
    UserService,
    ZoneDefinitionService,
)
from src.application.services.alert_service import AlertService
from src.application.services.box_service import BoxService
from src.application.services.pack_service import PackService, SubscriptionService
from src.application.services.paiement_service import PaiementService
from src.application.services.pre_consultation_service import PreConsultationService
from src.application.services.promotion_service import PromotionService
from src.application.services.schedule_service import ScheduleService
from src.infrastructure.database.connection import get_session
from src.domain.exceptions import AuthenticationError
from src.infrastructure.database.repositories import (
    BoxAssignmentRepository,
    BoxRepository,
    PackRepository,
    PaiementRepository,
    PatientRepository,
    PatientSubscriptionRepository,
    PatientZoneRepository,
    PreConsultationRepository,
    PromotionRepository,
    QuestionRepository,
    QuestionResponseRepository,
    RoleRepository,
    ScheduleRepository,
    SessionRepository,
    SideEffectRepository,
    UserRepository,
    WaitingQueueRepository,
    ZoneDefinitionRepository,
)
from src.infrastructure.security.jwt import decode_access_token

security = HTTPBearer(auto_error=False)


# Database session
async def get_db() -> AsyncSession:
    """Get database session."""
    async for session in get_session():
        yield session


# Repository dependencies
def get_role_repository(session: Annotated[AsyncSession, Depends(get_db)]) -> RoleRepository:
    """Get role repository."""
    return RoleRepository(session)


def get_user_repository(session: Annotated[AsyncSession, Depends(get_db)]) -> UserRepository:
    """Get user repository."""
    return UserRepository(session)


def get_patient_repository(session: Annotated[AsyncSession, Depends(get_db)]) -> PatientRepository:
    """Get patient repository."""
    return PatientRepository(session)


def get_zone_definition_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ZoneDefinitionRepository:
    """Get zone definition repository."""
    return ZoneDefinitionRepository(session)


def get_patient_zone_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PatientZoneRepository:
    """Get patient zone repository."""
    return PatientZoneRepository(session)


def get_question_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> QuestionRepository:
    """Get question repository."""
    return QuestionRepository(session)


def get_question_response_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> QuestionResponseRepository:
    """Get question response repository."""
    return QuestionResponseRepository(session)


def get_session_repository(session: Annotated[AsyncSession, Depends(get_db)]) -> SessionRepository:
    """Get session repository."""
    return SessionRepository(session)


def get_pre_consultation_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PreConsultationRepository:
    """Get pre-consultation repository."""
    return PreConsultationRepository(session)


def get_side_effect_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SideEffectRepository:
    """Get side effect repository."""
    return SideEffectRepository(session)


def get_pack_repository(session: Annotated[AsyncSession, Depends(get_db)]) -> PackRepository:
    """Get pack repository."""
    return PackRepository(session)


def get_patient_subscription_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PatientSubscriptionRepository:
    """Get patient subscription repository."""
    return PatientSubscriptionRepository(session)


def get_paiement_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PaiementRepository:
    """Get paiement repository."""
    return PaiementRepository(session)


def get_promotion_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PromotionRepository:
    """Get promotion repository."""
    return PromotionRepository(session)


def get_box_repository(session: Annotated[AsyncSession, Depends(get_db)]) -> BoxRepository:
    """Get box repository."""
    return BoxRepository(session)


def get_box_assignment_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> BoxAssignmentRepository:
    """Get box assignment repository."""
    return BoxAssignmentRepository(session)


def get_schedule_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ScheduleRepository:
    """Get schedule repository."""
    return ScheduleRepository(session)


def get_waiting_queue_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> WaitingQueueRepository:
    """Get waiting queue repository."""
    return WaitingQueueRepository(session)


# Service dependencies
def get_auth_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    role_repo: Annotated[RoleRepository, Depends(get_role_repository)],
) -> AuthService:
    """Get auth service."""
    return AuthService(user_repo, role_repo)


def get_user_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    role_repo: Annotated[RoleRepository, Depends(get_role_repository)],
) -> UserService:
    """Get user service."""
    return UserService(user_repo, role_repo)


def get_role_service(
    role_repo: Annotated[RoleRepository, Depends(get_role_repository)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> RoleService:
    """Get role service."""
    return RoleService(role_repo, user_repo)


def get_patient_service(
    patient_repo: Annotated[PatientRepository, Depends(get_patient_repository)],
) -> PatientService:
    """Get patient service."""
    return PatientService(patient_repo)


def get_zone_definition_service(
    zone_repo: Annotated[ZoneDefinitionRepository, Depends(get_zone_definition_repository)],
) -> ZoneDefinitionService:
    """Get zone definition service."""
    return ZoneDefinitionService(zone_repo)


def get_patient_zone_service(
    patient_zone_repo: Annotated[PatientZoneRepository, Depends(get_patient_zone_repository)],
    zone_def_repo: Annotated[ZoneDefinitionRepository, Depends(get_zone_definition_repository)],
    patient_repo: Annotated[PatientRepository, Depends(get_patient_repository)],
) -> PatientZoneService:
    """Get patient zone service."""
    return PatientZoneService(patient_zone_repo, zone_def_repo, patient_repo)


def get_question_service(
    question_repo: Annotated[QuestionRepository, Depends(get_question_repository)],
) -> QuestionService:
    """Get question service."""
    return QuestionService(question_repo)


def get_questionnaire_service(
    question_repo: Annotated[QuestionRepository, Depends(get_question_repository)],
    response_repo: Annotated[QuestionResponseRepository, Depends(get_question_response_repository)],
    pre_consultation_repo: Annotated[
        PreConsultationRepository, Depends(get_pre_consultation_repository)
    ],
) -> QuestionnaireService:
    """Get questionnaire service."""
    return QuestionnaireService(question_repo, response_repo, pre_consultation_repo)


def get_session_service(
    session_repo: Annotated[SessionRepository, Depends(get_session_repository)],
    patient_repo: Annotated[PatientRepository, Depends(get_patient_repository)],
    patient_zone_repo: Annotated[PatientZoneRepository, Depends(get_patient_zone_repository)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> SessionService:
    """Get session service."""
    return SessionService(session_repo, patient_repo, patient_zone_repo, user_repo)


def get_dashboard_service(
    patient_repo: Annotated[PatientRepository, Depends(get_patient_repository)],
    session_repo: Annotated[SessionRepository, Depends(get_session_repository)],
    side_effect_repo: Annotated[SideEffectRepository, Depends(get_side_effect_repository)],
    paiement_repo: Annotated[PaiementRepository, Depends(get_paiement_repository)],
) -> DashboardService:
    """Get dashboard service."""
    return DashboardService(patient_repo, session_repo, side_effect_repo, paiement_repo)


def get_pre_consultation_service(
    pre_consultation_repo: Annotated[
        PreConsultationRepository, Depends(get_pre_consultation_repository)
    ],
    patient_repo: Annotated[PatientRepository, Depends(get_patient_repository)],
    zone_repo: Annotated[ZoneDefinitionRepository, Depends(get_zone_definition_repository)],
    patient_zone_repo: Annotated[PatientZoneRepository, Depends(get_patient_zone_repository)],
) -> PreConsultationService:
    """Get pre-consultation service."""
    return PreConsultationService(pre_consultation_repo, patient_repo, zone_repo, patient_zone_repo)


def get_alert_service(
    pre_consultation_repo: Annotated[
        PreConsultationRepository, Depends(get_pre_consultation_repository)
    ],
    session_repo: Annotated[SessionRepository, Depends(get_session_repository)],
    side_effect_repo: Annotated[SideEffectRepository, Depends(get_side_effect_repository)],
) -> AlertService:
    """Get alert service."""
    return AlertService(pre_consultation_repo, session_repo, side_effect_repo)


def get_pack_service(
    pack_repo: Annotated[PackRepository, Depends(get_pack_repository)],
) -> PackService:
    """Get pack service."""
    return PackService(pack_repo)


def get_subscription_service(
    subscription_repo: Annotated[
        PatientSubscriptionRepository, Depends(get_patient_subscription_repository)
    ],
    pack_repo: Annotated[PackRepository, Depends(get_pack_repository)],
    patient_repo: Annotated[PatientRepository, Depends(get_patient_repository)],
) -> SubscriptionService:
    """Get subscription service."""
    return SubscriptionService(subscription_repo, pack_repo, patient_repo)


def get_paiement_service(
    paiement_repo: Annotated[PaiementRepository, Depends(get_paiement_repository)],
    patient_repo: Annotated[PatientRepository, Depends(get_patient_repository)],
) -> PaiementService:
    """Get paiement service."""
    return PaiementService(paiement_repo, patient_repo)


def get_promotion_service(
    promotion_repo: Annotated[PromotionRepository, Depends(get_promotion_repository)],
) -> PromotionService:
    """Get promotion service."""
    return PromotionService(promotion_repo)


def get_box_service(
    box_repo: Annotated[BoxRepository, Depends(get_box_repository)],
    assignment_repo: Annotated[BoxAssignmentRepository, Depends(get_box_assignment_repository)],
) -> BoxService:
    """Get box service."""
    return BoxService(box_repo, assignment_repo)


def get_schedule_service(
    schedule_repo: Annotated[ScheduleRepository, Depends(get_schedule_repository)],
    queue_repo: Annotated[WaitingQueueRepository, Depends(get_waiting_queue_repository)],
    patient_repo: Annotated[PatientRepository, Depends(get_patient_repository)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    box_assignment_repo: Annotated[BoxAssignmentRepository, Depends(get_box_assignment_repository)],
    patient_zone_repo: Annotated[PatientZoneRepository, Depends(get_patient_zone_repository)],
    pre_consultation_repo: Annotated[PreConsultationRepository, Depends(get_pre_consultation_repository)],
    zone_def_repo: Annotated[ZoneDefinitionRepository, Depends(get_zone_definition_repository)],
) -> ScheduleService:
    """Get schedule service."""
    return ScheduleService(
        schedule_repo, queue_repo, patient_repo, user_repo,
        box_assignment_repo, patient_zone_repo, pre_consultation_repo,
        zone_def_repo,
    )


# Authentication dependency
async def get_current_user(
    request: Request,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    session_token: Annotated[Optional[str], Cookie()] = None,
) -> dict:
    """Get current authenticated user from cookie or Authorization header."""
    # Extract token: cookie first, then Authorization header
    token: str | None = None
    if session_token:
        token = session_token
    elif credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise",
        )

    try:
        payload = decode_access_token(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide ou expiré",
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
            )
        return await auth_service.get_current_user(user_id)
    except HTTPException:
        raise
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expiré",
        )
    except pyjwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
        )
    except AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Erreur d'authentification",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Erreur d'authentification",
        )


# Permission checking dependency
def require_permission(permission: str):
    """Create a dependency that checks for a specific permission."""

    async def check_permission(current_user: Annotated[dict, Depends(get_current_user)]) -> dict:
        if permission not in current_user.get("permissions", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission insuffisante",
            )
        return current_user

    return check_permission


# Type aliases for common dependencies
CurrentUser = Annotated[dict, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
