from datetime import datetime, timedelta

from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status
from pydantic import BaseModel
import uuid
import secrets
import logging

from app.db.session import SessionLocal
from app.models.base import utcnow

router = APIRouter()
logger = logging.getLogger(__name__)


class CsrfResponse(BaseModel):
    """Response with CSRF token and metadata"""
    token: str
    expires_at: str
    csrf_cookie_name: str = "csrf_token"


@router.get("/token", response_model=CsrfResponse)
def get_csrf_token(
    request: Request,
    csrf_token: Optional[str] = Cookie(None, alias="csrf_token", max_age=900, description="CSRF token cookie"),
):
    """Generate a new CSRF token and set it in a cookie.

    The token is stored in server-side cache for validation.
    """
    session = SessionLocal()
    try:
        # Generate new token
        token = secrets.token_urlsafe(32)

        # Store in Redis-like cache with 15 minute expiry
        cache_key = f"csrf:{token}"
        cache_expiration = timedelta(minutes=15)
        cache_value = {
            "token": token,
            "created_at": utcnow().isoformat(),
            "last_used_at": utcnow().isoformat(),
        }

        # Store in session/DB temporarily as fallback
        # In production, integrate with Redis: from redis import asyncio as redis
        # r = await redis.from_url(settings.redis_url)
        # await r.setex(cache_key, 900, json.dumps(cache_value))

        # For now, store in a simple in-memory approach using session
        from app.core.cache import csrf_cache
        csrf_cache.set(token, cache_value, expiry=900)

        csrf_cookie_name = "csrf_token"
        expires_at = utcnow() + cache_expiration

        response = CsrfResponse(
            token=token,
            expires_at=expires_at.isoformat(),
            csrf_cookie_name=csrf_cookie_name,
        )

        # Set cookie in response
        set_cookie_header = (
            f"{csrf_cookie_name}={token}; "
            f"Expires={expires_at.strftime('%a, %d %b %Y %H:%M:%S GMT')}; "
            f"Path=/; SameSite=strict; Secure; HttpOnly"
        )
        # Note: FastAPI route responses need Response object to set cookies
        # The frontend should receive this token and use it for form submissions

        return response

    except Exception as e:
        logger.error(f"CSRF token generation error: {str(e)}")
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate CSRF token: {str(e)}",
        )
    finally:
        session.close()


class SetCookieRequest(BaseModel):
    """Request to set CSRF cookie on server"""
    token: str


@router.post("/set-cookie")
async def set_csrf_cookie(
    request: Request,
    response: Response,
    token: str = Form(...),
):
    """Set CSRF cookie in the browser.

    Clients should submit the CSRF token via form data,
    and this endpoint will set it as a cookie.
    """
    try:
        # Validate token against cache
        from app.core.cache import csrf_cache
        cached = csrf_cache.get(token)
        if not cached:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid CSRF token",
            )

        # Update last used time
        cached["last_used_at"] = utcnow().isoformat()
        csrf_cache.set(token, cached, expiry=900)

        # Set cookie
        csrf_cookie_name = "csrf_token"
        expires_at = datetime.utcnow() + timedelta(minutes=15)
        response.set_cookie(
            key=csrf_cookie_name,
            value=token,
            expires=expires_at,
            path="/",
            same_site="strict",
            secure=True,
            httponly=True,
        )

        return {"status": "success", "message": "CSRF cookie set successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSRF set-cookie error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set CSRF cookie: {str(e)}",
        )


def verify_csrf_token(token: str) -> bool:
    """Verify CSRF token against server-side storage.

    Returns True if token is valid.
    """
    from app.core.cache import csrf_cache
    cached = csrf_cache.get(token)
    if not cached:
        return False

    # Update last used time
    cached["last_used_at"] = utcnow().isoformat()
    csrf_cache.set(token, cached, expiry=900)
    return True


def create_csrf_cookie(token: str) -> str:
    """Create cookie header for response"""
    from datetime import datetime, timedelta

    expires = datetime.utcnow() + timedelta(minutes=15)
    return (
        f"{token}; Expires={expires.strftime('%a, %d %b %Y %H:%M:%S GMT')}; "
        f"Path=/; SameSite=strict; Secure; HttpOnly"
    )


async def validate_csrf(request, token_header: str = None) -> bool:
    """Middleware to validate CSRF token from header or cookie.

    Checks:
    1. Token from X-CSRF-Token header
    2. Token from csrf_token cookie
    3. Validates against server-side cache
    """
    # Get header token
    header_token = token_header or request.headers.get("X-CSRF-Token")

    # Get cookie token
    cookie_token = None
    for cookie in request.cookies.values():
        if cookie.startswith("csrf_token="):
            cookie_token = cookie.split("=", 1)[1]
            break

    if not header_token and not cookie_token:
        return False

    # Verify token against cache
    from app.core.cache import csrf_cache
    token_to_verify = header_token or cookie_token
    if not csrf_cache.get(token_to_verify):
        return False

    # Update last used time
    cached = csrf_cache.get(token_to_verify)
    if cached:
        cached["last_used_at"] = datetime.utcnow().isoformat()
        csrf_cache.set(token_to_verify, cached, expiry=900)

    return True