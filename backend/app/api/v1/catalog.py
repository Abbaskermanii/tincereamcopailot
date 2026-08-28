from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlmodel import Session, select

from app.db.session import get_session
from app.models import Category, Product, ProductImage
from app.schemas.store import (
    CategoryDetail,
    CategoryNode,
    ProductDetail,
    ProductListItem,
    ProductPage,
)
from app.services.cache import cache_get_json, cache_set_json

router = APIRouter()


def _list_item(p: Product) -> dict:
    img = p.primary_image
    return {
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "price": float(p.price),
        "compare_at_price": float(p.compare_at_price) if p.compare_at_price else None,
        "short_description": p.short_description,
        "stock_qty": p.stock_qty,
        "primary_image_url": img.url if img else None,
    }


def _detail(p: Product) -> dict:
    base = _list_item(p)
    cat = p.category
    return {
        **base,
        "description": p.description,
        "sku": p.sku,
        "weight_grams": p.weight_grams,
        "material": p.material,
        "dimensions": p.dimensions,
        "meta_title": p.meta_title,
        "meta_description": p.meta_description,
        "category_id": p.category_id,
        "category_name": cat.name if cat else None,
        "category_slug": cat.slug if cat else None,
        "discount_percent": p.discount_percent,
        "images": [
            {
                "id": i.id,
                "url": i.url,
                "alt_text": i.alt_text,
                "sort_order": i.sort_order,
                "is_primary": i.is_primary,
            }
            for i in sorted(p.images, key=lambda x: x.sort_order)
        ],
    }


@router.get("/categories", response_model=list[CategoryNode])
async def list_categories(session: Session = Depends(get_session)) -> list[CategoryNode]:
    cats = session.exec(select(Category).order_by(Category.name)).all()  # type: ignore[arg-type]
    nodes = {c.id: CategoryNode.model_validate(c) for c in cats}
    roots: list[CategoryNode] = []
    for c in cats:
        node = nodes[c.id]
        if c.parent_id and c.parent_id in nodes:
            nodes[c.parent_id].children.append(node)
        else:
            roots.append(node)
    return roots


@router.get("/categories/{slug}", response_model=CategoryDetail)
async def category_detail(slug: str, session: Session = Depends(get_session)) -> CategoryDetail:
    cat = session.exec(select(Category).where(Category.slug == slug)).first()  # type: ignore[arg-type]
    if not cat:
        raise HTTPException(404, "دستهٔ موردنظر یافت نشد.")
    count = session.exec(
        select(func.count()).select_from(Product).where(Product.category_id == cat.id)
    ).one()
    detail = CategoryDetail.model_validate(cat)
    detail.product_count = int(count)
    return detail


SORTS = {
    "newest": Product.created_at.desc(),
    "price_asc": Product.price.asc(),
    "price_desc": Product.price.desc(),
    "name": Product.name.asc(),
}


def _product_list_key(**kw: object) -> str:
    return "products:" + ",".join(f"{k}={v}" for k, v in sorted(kw.items()) if v not in (None, ""))


@router.get("/products", response_model=ProductPage)
async def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=48),
    category: str | None = None,
    search: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    sort: str = Query(default="newest"),
    in_stock_only: bool = False,
    session: Session = Depends(get_session),
) -> ProductPage:
    sort_col = SORTS.get(sort, SORTS["newest"])

    # hot-path cache (short TTL); invalidated on stock changes
    cache_key = _product_list_key(
        page=page,
        page_size=page_size,
        category=category or "",
        search=(search or "").lower(),
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        stock=in_stock_only,
    )
    cached = cache_get_json(cache_key)
    if cached is not None:
        return ProductPage.model_validate(cached)

    category_ids: list[str] | None = None
    if category:
        cache_key = f"catids:{category}"
        category_ids = cache_get_json(cache_key)
        if category_ids is None:
            cat = session.exec(select(Category).where(Category.slug == category)).first()  # type: ignore[arg-type]
            if cat:
                children = session.exec(
                    select(Category.id).where(Category.parent_id == cat.id)  # type: ignore[arg-type]
                ).all()
                category_ids = [cat.id] + list(children)
            else:
                category_ids = []
            cache_set_json(cache_key, category_ids, ttl_seconds=300)

    filters = [Product.is_active == True]  # noqa: E712
    if category_ids is not None:
        if not category_ids:
            return ProductPage(items=[], total=0, page=page, page_size=page_size, pages=0)
        filters.append(Product.category_id.in_(category_ids))
    if search:
        like = f"%{search}%"
        filters.append(or_(Product.name.ilike(like), Product.short_description.ilike(like)))
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
    if in_stock_only:
        filters.append(Product.stock_qty > 0)

    stmt = select(Product).where(*filters).order_by(sort_col)  # type: ignore[arg-type]
    total = session.exec(select(func.count()).select_from(Product).where(*filters)).one()
    items = session.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()

    result = ProductPage(
        items=[ProductListItem(**_list_item(p)) for p in items],
        total=int(total),
        page=page,
        page_size=page_size,
        pages=(int(total) + page_size - 1) // page_size,
    )
    cache_set_json(cache_key, result.model_dump(mode="json"), ttl_seconds=60)
    return result


@router.get("/products/{slug}", response_model=ProductDetail)
async def product_detail(slug: str, session: Session = Depends(get_session)) -> ProductDetail:
    p = session.exec(
        select(Product).where(Product.slug == slug, Product.is_active == True)  # noqa: E712
    ).first()
    if not p:
        raise HTTPException(404, "محصول یافت نشد.")
    return ProductDetail(**_detail(p))


# keep images listing reachable (used by admin preview tooling)
@router.get("/products/{slug}/images", response_model=list[dict])
async def product_images(slug: str, session: Session = Depends(get_session)) -> list[dict]:
    p = session.exec(select(Product).where(Product.slug == slug)).first()  # type: ignore[arg-type]
    if not p:
        raise HTTPException(404, "محصول یافت نشد.")
    imgs = session.exec(
        select(ProductImage)
        .where(ProductImage.product_id == p.id)  # type: ignore[arg-type]
        .order_by(ProductImage.sort_order)  # type: ignore[arg-type]
    ).all()
    return [{"url": i.url, "alt_text": i.alt_text, "is_primary": i.is_primary} for i in imgs]
