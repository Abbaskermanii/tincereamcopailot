from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.api.v1.admin_api import admin as admin_api_router
from app.api.v1.admin_stats import router as admin_stats_router
from app.api.v1.catalog import router as catalog_router
from app.api.v1.community import public as community_public
from app.api.v1.coupons import router as coupons_router
from app.api.v1.feeds import router as feeds_router
from app.api.v1.orders import router as orders_router
from app.api.v1.payments import router as payments_router
from app.api.v1.search import router as search_router
from app.api.v1.auth import admin_router, router as auth_router, users_router, wishlist_router
from app.api.v1.cart import router as cart_router
from app.api.v1.homepage import router as homepage_router
from app.api.v1.operations import admin as operations_admin, public as operations_public
from app.services.storage import read_image

api_router = APIRouter()


@api_router.get("/media/{object_name:path}", tags=["media"])
async def media(object_name: str) -> Response:
    try:
        content, content_type = read_image(object_name)
    except Exception as exc:
        raise HTTPException(404, "تصویر یافت نشد.") from exc
    # Phase 14: no immutable — allow revalidation, add ETag for cache busting
    import hashlib

    etag = hashlib.sha256(content).hexdigest()[:16]
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "ETag": f'"{etag}"',
        },
    )

api_router.include_router(catalog_router, tags=["catalog"])
api_router.include_router(orders_router, tags=["orders"])
api_router.include_router(payments_router, tags=["payments"])
api_router.include_router(coupons_router, tags=["coupons"])
api_router.include_router(feeds_router, tags=["feeds"])
api_router.include_router(search_router, tags=["search"])
api_router.include_router(admin_stats_router, tags=["admin"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(users_router, tags=["users"])
api_router.include_router(admin_router, tags=["admin"])
api_router.include_router(wishlist_router, tags=["wishlist"])
api_router.include_router(operations_admin, tags=["admin"])
api_router.include_router(operations_public, tags=["content", "operations"])
api_router.include_router(community_public, tags=["content", "community"])
api_router.include_router(admin_api_router, tags=["admin"])
api_router.include_router(cart_router, tags=["cart"])
api_router.include_router(homepage_router, tags=["homepage"])


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Fast liveness endpoint; database status is reported without failing liveness."""
    try:
        from app.db.session import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception:
        return {"status": "degraded", "database": "unavailable"}
