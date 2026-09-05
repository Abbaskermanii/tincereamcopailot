import logging
from fastapi.responses import JSONResponse

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.admin.panel import mount_admin
from app.api.v1.router import api_router
from app.core.config import get_settings

settings = get_settings()

# Fail fast in production if insecure defaults are still active.
# This must run at import time so `docker compose up` and `pytest` surface
# misconfiguration immediately, but only blocks when ENVIRONMENT=production.
settings.validate_production_settings()

logging.basicConfig(
    level=logging.INFO,
    format='{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":%(message)r}',
)

# Docs should not be exposed unauthenticated in production (M13)
_docs_url = None if settings.is_production() else "/api/docs"
_openapi_url = None if settings.is_production() else "/api/openapi.json"
app = FastAPI(title=settings.app_name, docs_url=_docs_url, openapi_url=_openapi_url)


@app.get("/api/health", tags=["system"])
async def _health_alias() -> dict[str, str]:
    """Alias without version prefix for load-balancer checks."""
    try:
        from sqlalchemy import text
        from app.db.session import engine

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception:
        return {"status": "degraded", "database": "unavailable"}

mount_admin(app)


# Security headers (Phase 13: CSP, HSTS, etc.)
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    # Do not cache API docs in production
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.is_production():
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Minimal CSP for API (frontend has its own); allow self and data/blob for images
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    return response


app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.next_public_site_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Cookie", "X-Requested-With"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger = logging.getLogger("tinceream")
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={"path": request.url.path, "method": request.method},
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred",
            "path": request.url.path,
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "path": request.url.path,
        },
    )


app.include_router(api_router, prefix="/api/v1")
