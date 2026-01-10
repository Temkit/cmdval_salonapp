"""API dependencies for dependency injection."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
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
from src.infrastructure.database.connection import get_session
from src.infrastructure.database.repositories import (
    PatientRepository,
    PatientZoneRepository,
    QuestionRepository,
    QuestionResponseRepository,
    RoleRepository,
    SessionRepository,
    UserRepository,
    ZoneDefinitionRepository,
)
from src.infrastructure.security.jwt import decode_access_token

security = HTTPBearer()


# Database session
async def get_db() -> AsyncSession:
    """Get database session."""
    async for session in get_session():
        yield session


# Repository dependencies
def get_role_repository(
    session: Annotated[AsyncSession, Depends(get_db)]
) -> RoleRepository:
    """Get role repository."""
    return RoleRepository(session)


def get_user_repository(
    session: Annotated[AsyncSession, Depends(get_db)]
) -> UserRepository:
    """Get user repository."""
    return UserRepository(session)


def get_patient_repository(
    session: Annotated[AsyncSession, Depends(get_db)]
) -> PatientRepository:
    """Get patient repository."""
    return PatientRepository(session)


def get_zone_definition_repository(
    session: Annotated[AsyncSession, Depends(get_db)]
) -> ZoneDefinitionRepository:
    """Get zone definition repository."""
    return ZoneDefinitionRepository(session)


def get_patient_zone_repository(
    session: Annotated[AsyncSession, Depends(get_db)]
) -> PatientZoneRepository:
    """Get patient zone repository."""
    return PatientZoneRepository(session)


def get_question_repository(
    session: Annotated[AsyncSession, Depends(get_db)]
) -> QuestionRepository:
    """Get question repository."""
    return QuestionRepository(session)


def get_question_response_repository(
    session: Annotated[AsyncSession, Depends(get_db)]
) -> QuestionResponseRepository:
    """Get question response repository."""
    return QuestionResponseRepository(session)


def get_session_repository(
    session: Annotated[AsyncSession, Depends(get_db)]
) -> SessionRepository:
    """Get session repository."""
    return SessionRepository(session)


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
    patient_repo: Annotated[PatientRepository, Depends(get_patient_repository)],
) -> QuestionnaireService:
    """Get questionnaire service."""
    return QuestionnaireService(question_repo, response_repo, patient_repo)


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
) -> DashboardService:
    """Get dashboard service."""
    return DashboardService(patient_repo, session_repo)


# Authentication dependency
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict:
    """Get current authenticated user."""
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide",
            )
        return await auth_service.get_current_user(user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


# Permission checking dependency
def require_permission(permission: str):
    """Create a dependency that checks for a specific permission."""

    async def check_permission(
        current_user: Annotated[dict, Depends(get_current_user)]
    ) -> dict:
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
