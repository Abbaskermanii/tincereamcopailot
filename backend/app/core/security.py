"""Password hashing and JWT helpers shared by authentication features."""

import uuid
from datetime import datetime, timedelta

from app.compat import UTC
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


def _access_secret() -> str:
    return get_settings().secret_key


def _refresh_secret() -> str:
    return get_settings().get_refresh_secret()


def _previous_access_secrets() -> list[str]:
    """Return list of previous access secrets still valid for token verification."""
    raw = get_settings().previous_secret_keys
    if not raw:
        return []
    return [s.strip() for s in raw.split(",") if s.strip()]


def _previous_refresh_secrets() -> list[str]:
    """Return list of previous refresh secrets still valid for token verification."""
    raw = get_settings().previous_refresh_secret_keys
    if not raw:
        return []
    return [s.strip() for s in raw.split(",") if s.strip()]


def create_access_token(
    subject: str,
    *,
    expires_delta: timedelta | None = None,
    claims: dict[str, Any] | None = None,
) -> str:
    """Create a signed access token for a user or service subject."""
    s = get_settings()
    delta = expires_delta if expires_delta is not None else timedelta(minutes=s.access_token_expire_minutes)
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + delta,
        "type": "access",
        "jti": str(uuid.uuid4()),
    }
    if claims:
        # Never trust caller to override core claims
        for k in ("sub", "iat", "exp", "type", "jti"):
            claims.pop(k, None)
        payload.update(claims)
    return jwt.encode(payload, _access_secret(), algorithm="HS256")


def create_refresh_token(
    subject: str,
    *,
    expires_delta: timedelta | None = None,
    claims: dict[str, Any] | None = None,
) -> str:
    """Create a signed refresh token with a distinct token type and secret."""
    s = get_settings()
    delta = expires_delta if expires_delta is not None else timedelta(days=s.refresh_token_expire_days)
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + delta,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }
    if claims:
        for k in ("sub", "iat", "exp", "type", "jti"):
            claims.pop(k, None)
        payload.update(claims)
    return jwt.encode(payload, _refresh_secret(), algorithm="HS256")


def decode_token(token: str, *, expected_type: str = "access") -> dict[str, Any]:
    """Decode and validate a token, raising JWTError for invalid credentials.

    Access and refresh tokens are signed with different secrets (refresh falls
    back to the access secret when no dedicated refresh secret is configured).
    Supports secret rotation: current secret is tried first, then previous secrets.
    """
    if expected_type == "refresh":
        secrets_to_try = [_refresh_secret(), _access_secret()] + _previous_refresh_secrets() + _previous_access_secrets()
    else:
        secrets_to_try = [_access_secret(), _refresh_secret()] + _previous_access_secrets() + _previous_refresh_secrets()

    last_exc: Exception | None = None
    for secret in secrets_to_try:
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            break
        except JWTError as exc:
            last_exc = exc
            continue
    else:
        raise last_exc or JWTError("Invalid token")

    if payload.get("type") != expected_type or not payload.get("sub"):
        raise JWTError("Invalid token type or subject")
    if not payload.get("jti"):
        # Old tokens without jti are still accepted but will be phased out
        pass
    return payload
