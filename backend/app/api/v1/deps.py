"""FastAPI dependencies for authentication and authorization.

Separated from auth.py to break circular imports with permissions.py.
"""

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.db.session import get_session
from app.core.security import decode_token
from app.models import User

bearer = HTTPBearer(auto_error=False)

ACCESS_COOKIE = "tinceram_access"
REFRESH_COOKIE = "tinceram_refresh"


def _resolve_token(
    credentials: HTTPAuthorizationCredentials | None,
    request: Request,
) -> str | None:
    if credentials:
        return credentials.credentials
    return request.cookies.get(ACCESS_COOKIE)


def current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: Session = Depends(get_session),
) -> User:
    token = _resolve_token(credentials, request)
    if not token:
        raise HTTPException(401, "احراز هویت لازم است.", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_token(token)
    except Exception as exc:
        raise HTTPException(401, "توکن نامعتبر است.") from exc
    user = session.get(User, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(401, "کاربر یافت نشد.")
    return user


def optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: Session = Depends(get_session),
) -> User | None:
    """Like current_user but returns None for guests (used by guest checkout)."""
    token = _resolve_token(credentials, request)
    if not token:
        return None
    try:
        payload = decode_token(token)
    except Exception:
        return None
    user = session.get(User, payload["sub"])
    return user if user and user.is_active else None


def admin_user(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403, "دسترسی مدیر لازم است.")
    return user
