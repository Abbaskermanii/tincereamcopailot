"""Redis-backed fixed-window rate limiter (no external dependency).

Usage as a FastAPI dependency:

    @router.post("/login", dependencies=[Depends(rate_limit("login", 5, 60))])

Errors are swallowed — Redis being down must never take the API down.
"""

from fastapi import HTTPException, Request

from app.core.config import get_settings
from app.services.cache import get_redis


def _client_ip(request: Request) -> str:
    # H8 fix: do not blindly trust X-Forwarded-For (spoofable). Only use it when
    # the direct client is a trusted proxy (loopback/private). Otherwise use
    # the direct TCP peer.
    client_host = request.client.host if request.client else "unknown"
    fwd = request.headers.get("x-forwarded-for")
    if fwd and client_host in ("127.0.0.1", "::1", "10.0.0.1", "172.20.0.1"):
        # Take the leftmost untrusted XFF entry (original client) but validate it
        candidate = fwd.split(",")[0].strip()
        # Basic IP validation (v4/v6) — reject header injection
        if candidate and len(candidate) < 64 and candidate.replace(".", "").replace(":", "").replace("-", "").isalnum():
            return candidate
    return client_host


def hit(bucket: str, key: str, limit: int, window_seconds: int) -> bool:
    """Record a hit; return False when the caller exceeded the limit."""
    try:
        client = get_redis()
        redis_key = f"rl:{bucket}:{key}:{int(__import__('time').time()) // window_seconds}"
        count = client.incr(redis_key)
        if count == 1:
            client.expire(redis_key, window_seconds + 1)
        return count <= limit
    except Exception:
        return True


def rate_limit(bucket: str, limit: int, window_seconds: int):
    def dependency(request: Request) -> None:
        if not get_settings().rate_limit_enabled:
            return
        if not hit(bucket, _client_ip(request), limit, window_seconds):
            raise HTTPException(429, "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.")

    return dependency
