"""Domain-level exceptions for business logic errors."""


class DomainError(Exception):
    """Base class for all domain errors."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


# Entity Not Found Errors
class EntityNotFoundError(DomainError):
    """Entity not found in repository."""

    pass


class PatientNotFoundError(EntityNotFoundError):
    """Patient not found."""

    def __init__(self, patient_id: str | None = None) -> None:
        message = f"Patient {patient_id} non trouvé" if patient_id else "Patient non trouvé"
        super().__init__(message)


class UserNotFoundError(EntityNotFoundError):
    """User not found."""

    def __init__(self, user_id: str | None = None) -> None:
        message = f"Utilisateur {user_id} non trouvé" if user_id else "Utilisateur non trouvé"
        super().__init__(message)


class ZoneNotFoundError(EntityNotFoundError):
    """Zone not found."""

    def __init__(self, zone_id: str | None = None) -> None:
        message = f"Zone {zone_id} non trouvée" if zone_id else "Zone non trouvée"
        super().__init__(message)


class SessionNotFoundError(EntityNotFoundError):
    """Session not found."""

    def __init__(self, session_id: str | None = None) -> None:
        message = f"Séance {session_id} non trouvée" if session_id else "Séance non trouvée"
        super().__init__(message)


class RoleNotFoundError(EntityNotFoundError):
    """Role not found."""

    def __init__(self, role_id: str | None = None) -> None:
        message = f"Rôle {role_id} non trouvé" if role_id else "Rôle non trouvé"
        super().__init__(message)


class QuestionNotFoundError(EntityNotFoundError):
    """Question not found."""

    def __init__(self, question_id: str | None = None) -> None:
        message = f"Question {question_id} non trouvée" if question_id else "Question non trouvée"
        super().__init__(message)


# Conflict Errors
class DuplicateError(DomainError):
    """Duplicate entity error."""

    pass


class DuplicateCardCodeError(DuplicateError):
    """Card code already exists."""

    def __init__(self, code: str) -> None:
        super().__init__(f"Un patient avec le code carte {code} existe déjà")


class DuplicateUsernameError(DuplicateError):
    """Username already exists."""

    def __init__(self, username: str) -> None:
        super().__init__(f"Le nom d'utilisateur {username} est déjà utilisé")


class DuplicateZoneError(DuplicateError):
    """Patient already has this zone."""

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or "Ce patient a déjà un forfait pour cette zone")


# Business Rule Errors
class BusinessRuleError(DomainError):
    """Business rule violation."""

    pass


class InsufficientSessionsError(BusinessRuleError):
    """Patient has no remaining sessions for the zone."""

    def __init__(self) -> None:
        super().__init__("Aucune séance restante pour cette zone")


class ImmutableSessionError(BusinessRuleError):
    """Attempt to modify an immutable session."""

    def __init__(self) -> None:
        super().__init__("Les séances ne peuvent pas être modifiées après création")


class CannotDeleteSystemRoleError(BusinessRuleError):
    """Attempt to delete a system role."""

    def __init__(self, role_name: str) -> None:
        super().__init__(f"Le rôle système {role_name} ne peut pas être supprimé")


class CannotDeleteAdminUserError(BusinessRuleError):
    """Attempt to delete the admin user."""

    def __init__(self) -> None:
        super().__init__("L'utilisateur admin ne peut pas être supprimé")


class CannotModifyAdminRoleError(BusinessRuleError):
    """Attempt to modify the admin role."""

    def __init__(self) -> None:
        super().__init__("Le rôle admin ne peut pas être modifié")


class RoleInUseError(BusinessRuleError):
    """Role is assigned to users and cannot be deleted."""

    def __init__(self, role_name: str, user_count: int) -> None:
        super().__init__(
            f"Le rôle {role_name} est assigné à {user_count} utilisateur(s) "
            "et ne peut pas être supprimé"
        )


class SystemRoleError(BusinessRuleError):
    """Attempt to modify a system role."""

    def __init__(self, role_name: str) -> None:
        super().__init__(f"Le rôle système {role_name} ne peut pas être modifié ou supprimé")


# Authentication Errors
class AuthenticationError(DomainError):
    """Authentication related errors."""

    pass


class InvalidCredentialsError(AuthenticationError):
    """Invalid username or password."""

    def __init__(self) -> None:
        super().__init__("Identifiant ou mot de passe incorrect")


class InactiveUserError(AuthenticationError):
    """User account is inactive."""

    def __init__(self) -> None:
        super().__init__("Ce compte utilisateur est désactivé")


# Permission Errors
class PermissionDeniedError(DomainError):
    """User lacks required permission."""

    def __init__(self, permission: str | None = None) -> None:
        if permission:
            message = f"Permission requise : {permission}"
        else:
            message = "Permission insuffisante"
        super().__init__(message)
