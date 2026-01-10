"""Password hashing using Argon2id."""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Configure Argon2id with secure parameters
_hasher = PasswordHasher(
    time_cost=3,  # Iterations
    memory_cost=65536,  # 64 MB
    parallelism=4,  # Threads
    hash_len=32,
    salt_len=16,
)


def hash_password(password: str) -> str:
    """
    Hash a password using Argon2id.

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        password: Plain text password to verify
        password_hash: Stored hash to verify against

    Returns:
        True if password matches, False otherwise
    """
    try:
        _hasher.verify(password_hash, password)
        return True
    except VerifyMismatchError:
        return False


def check_needs_rehash(password_hash: str) -> bool:
    """
    Check if a password hash needs to be rehashed.

    This is useful when hash parameters change.

    Args:
        password_hash: Existing hash to check

    Returns:
        True if hash should be regenerated
    """
    return _hasher.check_needs_rehash(password_hash)
