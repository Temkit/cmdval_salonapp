"""API schemas."""

from src.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    PasswordChangeRequest,
    TokenResponse,
)
from src.schemas.base import AppBaseModel, MessageResponse, PaginatedResponse
from src.schemas.dashboard import (
    DashboardStatsResponse,
    PeriodStatsItem,
    PeriodStatsRequest,
    PeriodStatsResponse,
    PraticienStatsItem,
    PraticienStatsResponse,
    RecentActivityItem,
    RecentActivityResponse,
    ZoneStatsItem,
    ZoneStatsResponse,
)
from src.schemas.patient import (
    PatientCreate,
    PatientDetailResponse,
    PatientListResponse,
    PatientResponse,
    PatientUpdate,
)
from src.schemas.questionnaire import (
    PreConsultationQuestionnaireResponse,
    PreConsultationQuestionnaireUpdate,
    QuestionCreate,
    QuestionListResponse,
    QuestionOrderUpdate,
    QuestionResponse,
    QuestionResponseCreate,
    QuestionResponseItem,
    QuestionUpdate,
)
from src.schemas.role import (
    PermissionListResponse,
    PermissionResponse,
    RoleCreate,
    RoleListResponse,
    RoleResponse,
    RoleUpdate,
)
from src.schemas.session import (
    LaserTypeResponse,
    SessionCreate,
    SessionDetailResponse,
    SessionListResponse,
    SessionPhotoResponse,
    SessionResponse,
)
from src.schemas.user import (
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)
from src.schemas.zone import (
    PatientZoneCreate,
    PatientZoneListResponse,
    PatientZoneResponse,
    PatientZoneUpdate,
    ZoneDefinitionCreate,
    ZoneDefinitionListResponse,
    ZoneDefinitionResponse,
    ZoneDefinitionUpdate,
)

__all__ = [
    # Base
    "AppBaseModel",
    "MessageResponse",
    "PaginatedResponse",
    # Auth
    "LoginRequest",
    "TokenResponse",
    "PasswordChangeRequest",
    "CurrentUserResponse",
    # Role
    "RoleCreate",
    "RoleUpdate",
    "RoleResponse",
    "RoleListResponse",
    "PermissionResponse",
    "PermissionListResponse",
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserListResponse",
    # Patient
    "PatientCreate",
    "PatientUpdate",
    "PatientResponse",
    "PatientListResponse",
    "PatientDetailResponse",
    # Zone
    "ZoneDefinitionCreate",
    "ZoneDefinitionUpdate",
    "ZoneDefinitionResponse",
    "ZoneDefinitionListResponse",
    "PatientZoneCreate",
    "PatientZoneUpdate",
    "PatientZoneResponse",
    "PatientZoneListResponse",
    # Questionnaire
    "QuestionCreate",
    "QuestionUpdate",
    "QuestionResponse",
    "QuestionListResponse",
    "QuestionOrderUpdate",
    "QuestionResponseCreate",
    "QuestionResponseItem",
    "PreConsultationQuestionnaireResponse",
    "PreConsultationQuestionnaireUpdate",
    # Session
    "SessionCreate",
    "SessionResponse",
    "SessionListResponse",
    "SessionDetailResponse",
    "SessionPhotoResponse",
    "LaserTypeResponse",
    # Dashboard
    "DashboardStatsResponse",
    "ZoneStatsItem",
    "ZoneStatsResponse",
    "PraticienStatsItem",
    "PraticienStatsResponse",
    "PeriodStatsItem",
    "PeriodStatsRequest",
    "PeriodStatsResponse",
    "RecentActivityItem",
    "RecentActivityResponse",
]
