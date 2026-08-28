"""Instant-search autocomplete endpoint (name + category)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlmodel import Session, select

from app.db.session import get_session
from app.models import Category, Product

router = APIRouter()


@router.get("/search")
async def instant_search(
    q: str = Query(default="", max_length=64),
    limit: int = Query(default=8, ge=1, le=20),
    session: Session = Depends(get_session),
) -> dict:
    q = (q or "").strip()
    if not q:
        return {"query": "", "products": [], "categories": []}

    like = f"%{q}%"
    products = session.exec(
        select(Product)
        .where(
            Product.is_active == True,  # noqa: E712
            or_(Product.name.ilike(like), Product.short_description.ilike(like)),
        )
        .limit(limit)
    ).all()
    categories = session.exec(
        select(Category).where(Category.name.ilike(like)).limit(4)  # type: ignore[arg-type]
    ).all()

    def prod_row(p: Product) -> dict:
        img = p.primary_image
        return {
            "slug": p.slug,
            "name": p.name,
            "price": float(p.price),
            "image_url": img.url if img else None,
        }

    return {
        "query": q,
        "products": [prod_row(p) for p in products],
        "categories": [{"slug": c.slug, "name": c.name} for c in categories],
    }
