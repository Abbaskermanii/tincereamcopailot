"""Password hashing and JWT helpers shared by authentication features."""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Return a bcrypt hash suitable for storing in the user table."""
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    return pwd_context.verify(password, password_hash)


def create_access_token(
    subject: str,
    *,
    expires_delta: timedelta = timedelta(minutes=30),
    claims: dict[str, Any] | None = None,
) -> str:
    """Create a signed access token for a user or service subject."""
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + expires_delta,
        "type": "access",
    }
    if claims:
        payload.update(claims)
    return jwt.encode(payload, get_settings().secret_key, algorithm="HS256")


def create_refresh_token(
    subject: str,
    *,
    expires_delta: timedelta = timedelta(days=30),
    claims: dict[str, Any] | None = None,
) -> str:
    """Create a signed refresh token with a distinct token type."""
    return create_access_token(
        subject,
        expires_delta=expires_delta,
        claims={"type": "refresh", **(claims or {})},
    )


def decode_token(token: str, *, expected_type: str = "access") -> dict[str, Any]:
    """Decode and validate a token, raising JWTError for invalid credentials."""
    payload = jwt.decode(token, get_settings().secret_key, algorithms=["HS256"])
    if payload.get("type") != expected_type or not payload.get("sub"):
        raise JWTError("Invalid token type or subject")
    return payload
