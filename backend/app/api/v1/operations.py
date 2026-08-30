import json
import re
import secrets
from datetime import UTC, datetime
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import *
from app.api.v1.auth import admin_user, current_user
from app.services.homepage import invalidate_home
from app.services.storage import put_image

def _reading_time_minutes(body: str) -> int:
    if not body:
        return 0
    # strip html tags
    text = re.sub(r"<[^>]+>", " ", body)
    words = len(re.findall(r"\w+", text, flags=re.UNICODE))
    # Persian reading ~ 200-250 wpm, use 200
    return max(1, (words + 199) // 200) if words else 0


def _get_article_tags(session: Session, article_id: str) -> list[dict]:
    links = session.exec(select(ArticleTagLink).where(ArticleTagLink.article_id == article_id)).all()
    if not links:
        return []
    tag_ids = [l.tag_id for l in links]
    tags = session.exec(select(ArticleTag).where(ArticleTag.id.in_(tag_ids))).all() if tag_ids else []
    return [{"id": t.id, "name": t.name, "slug": t.slug} for t in tags]


def _sync_article_tags(session: Session, article_id: str, tag_slugs: list[str] | None):
    if tag_slugs is None:
        return
    # clear existing
    for link in session.exec(select(ArticleTagLink).where(ArticleTagLink.article_id == article_id)).all():
        session.delete(link)
    for slug in tag_slugs:
        slug = slug.strip().lower()
        if not slug:
            continue
        tag = session.exec(select(ArticleTag).where(ArticleTag.slug == slug)).first()
        if not tag:
            # create on fly
            tag = ArticleTag(name=slug, slug=slug)
            session.add(tag)
            session.flush()
        session.add(ArticleTagLink(article_id=article_id, tag_id=tag.id))

admin = APIRouter(prefix="/admin")
public = APIRouter()


@admin.post("/categories", status_code=201)
def create_category(data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    if s.exec(select(Category).where(Category.slug == data["slug"])).first():
        raise HTTPException(409, "slug تکراری است")
    if data.get("parent_id") and not s.get(Category, data["parent_id"]):
        raise HTTPException(400, "دسته والد یافت نشد")
    row = Category(**{k: data[k] for k in ("name", "slug")}, image_url=data.get("image_url"), description=data.get("description"), parent_id=data.get("parent_id"))
    s.add(row); s.commit(); s.refresh(row); return row


@admin.get("/categories")
def admin_categories(_: User = Depends(admin_user), s: Session = Depends(get_session)):
    return s.exec(select(Category).order_by(Category.name)).all()


@admin.patch("/categories/{category_id}")
def update_category(category_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Category, category_id)
    if not row: raise HTTPException(404, "دسته یافت نشد")
    if data.get("parent_id") == category_id: raise HTTPException(400, "چرخه دسته‌بندی مجاز نیست")
    for key in ("name", "slug", "image_url", "description", "parent_id"):
        if key in data: setattr(row, key, data[key])
    s.add(row); s.commit(); return row


@admin.delete("/categories/{category_id}")
def delete_category(category_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Category, category_id)
    if not row: raise HTTPException(404, "دسته یافت نشد")
    if s.exec(select(Product).where(Product.category_id == category_id)).first():
        raise HTTPException(409, "دسته دارای محصول است")
    s.delete(row); s.commit(); return {"ok": True}


@admin.post("/coupons", status_code=201)
def create_coupon(data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    code = str(data["code"]).strip().upper()
    if s.exec(select(Coupon).where(Coupon.code == code)).first(): raise HTTPException(409, "کد تکراری است")
    row = Coupon(code=code, discount_type=data["discount_type"], discount_value=data["discount_value"], min_order_amount=data.get("min_order_amount", 0), expires_at=data.get("expires_at"), usage_limit=data.get("usage_limit", 0))
    s.add(row); s.commit(); s.refresh(row); return row


@admin.get("/coupons")
def admin_coupons(_: User = Depends(admin_user), s: Session = Depends(get_session)):
    return s.exec(select(Coupon).order_by(Coupon.code)).all()


@admin.patch("/coupons/{coupon_id}")
def update_coupon(coupon_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Coupon, coupon_id)
    if not row: raise HTTPException(404, "کد یافت نشد")
    for key in ("discount_type", "discount_value", "min_order_amount", "expires_at", "usage_limit"):
        if key in data: setattr(row, key, data[key])
    s.add(row); s.commit(); return row


@admin.delete("/coupons/{coupon_id}")
def delete_coupon(coupon_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Coupon, coupon_id)
    if not row: raise HTTPException(404, "کد یافت نشد")
    s.delete(row); s.commit(); return {"ok": True}


@admin.post("/carousels", status_code=201)
def create_carousel(data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = Carousel(**data); s.add(row); s.commit(); invalidate_home(); s.refresh(row); return row


@admin.get("/carousels")
def admin_carousels(_: User = Depends(admin_user), s: Session = Depends(get_session)):
    return s.exec(select(Carousel).order_by(Carousel.sort_order)).all()


@admin.patch("/carousels/{carousel_id}")
def update_carousel(carousel_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Carousel, carousel_id)
    if not row: raise HTTPException(404, "بنر یافت نشد")
    for key, value in data.items():
        if hasattr(row, key): setattr(row, key, value)
    s.add(row); s.commit(); invalidate_home(); return row


@admin.delete("/carousels/{carousel_id}")
def delete_carousel(carousel_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Carousel, carousel_id)
    if not row: raise HTTPException(404, "بنر یافت نشد")
    s.delete(row); s.commit(); invalidate_home(); return {"ok": True}


@public.get("/carousels")
def public_carousels(s: Session = Depends(get_session)):
    now = datetime.now(UTC)
    return s.exec(select(Carousel).where(Carousel.is_active == True, (Carousel.starts_at == None) | (Carousel.starts_at <= now), (Carousel.ends_at == None) | (Carousel.ends_at >= now)).order_by(Carousel.sort_order)).all()  # noqa: E712


@admin.post("/products/{product_id}/images", status_code=201)
def add_image(product_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    if not s.get(Product, product_id): raise HTTPException(404, "محصول یافت نشد")
    if data.get("is_primary"):
        for image in s.exec(select(ProductImage).where(ProductImage.product_id == product_id)).all(): image.is_primary = False
    image = ProductImage(product_id=product_id, url=data["url"], alt_text=data.get("alt_text", ""), sort_order=data.get("sort_order", 0), is_primary=data.get("is_primary", False))
    s.add(image); s.commit(); s.refresh(image); return image


@admin.post("/products/{product_id}/images/upload", status_code=201)
async def upload_image(product_id: str, file: UploadFile = File(...), _: User = Depends(admin_user), s: Session = Depends(get_session)):
    if not s.get(Product, product_id): raise HTTPException(404, "محصول یافت نشد")
    allowed = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    if file.content_type not in allowed: raise HTTPException(415, "فرمت تصویر پشتیبانی نمی‌شود")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024: raise HTTPException(413, "حجم تصویر زیاد است")
    extension = allowed[file.content_type or "image/jpeg"]
    object_name = f"products/{product_id}/{secrets.token_hex(12)}.{extension}"
    image = ProductImage(product_id=product_id, url=put_image(object_name, data, file.content_type or "application/octet-stream"), alt_text=file.filename or "")
    s.add(image); s.commit(); s.refresh(image); return image


@admin.patch("/products/{product_id}/images/{image_id}/primary")
def primary_image(product_id: str, image_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    image = s.get(ProductImage, image_id)
    if not image or image.product_id != product_id: raise HTTPException(404, "تصویر یافت نشد")
    for row in s.exec(select(ProductImage).where(ProductImage.product_id == product_id)).all(): row.is_primary = row.id == image_id
    s.commit(); return {"ok": True}


@admin.delete("/products/{product_id}/images/{image_id}")
def delete_image(product_id: str, image_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    image = s.get(ProductImage, image_id)
    if not image or image.product_id != product_id: raise HTTPException(404, "تصویر یافت نشد")
    s.delete(image); s.commit(); return {"ok": True}

class ProductIn(BaseModel):
    name: str; slug: str; category_id: str; price: float; sku: str
    description: str = ""; short_description: str | None = None
    stock_qty: int = 0; is_active: bool = True
    brand_id: str | None = None
    compare_at_price: float | None = None

@admin.post("/products", status_code=201)
def create_product(p: ProductIn, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    if s.exec(select(Product).where((Product.slug == p.slug) | (Product.sku == p.sku))).first():
        raise HTTPException(409, "slug یا SKU تکراری است")
    data = p.model_dump()
    data["description"] = _sanitize_html(data.get("description") or "")
    if data.get("short_description"):
        data["short_description"] = _sanitize_html(str(data["short_description"]))
    row = Product(**data); s.add(row); s.commit(); s.refresh(row); return row

@admin.get("/products")
def products(_: User = Depends(admin_user), s: Session = Depends(get_session), offset: int = 0, limit: int = Query(50, le=100)):
    return s.exec(select(Product).offset(offset).limit(limit)).all()

@admin.patch("/products/{product_id}")
def update_product(product_id: str, p: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Product, product_id)
    if not row:
        raise HTTPException(404, "محصول یافت نشد")
    if "category_id" in p and not s.get(Category, p["category_id"]):
        raise HTTPException(400, "دسته محصول یافت نشد")
    if "slug" in p or "sku" in p:
        duplicate = s.exec(
            select(Product).where(
                Product.id != product_id,
                (Product.slug == p.get("slug", row.slug)) | (Product.sku == p.get("sku", row.sku)),
            )
        ).first()
        if duplicate:
            raise HTTPException(409, "slug یا SKU تکراری است")
    # M4 fix: allowlist to prevent mass assignment of id/created_at etc.
    allowed = {"name", "slug", "category_id", "description", "short_description", "price", "compare_at_price", "stock_qty", "sku", "weight_grams", "material", "dimensions", "is_active", "brand_id", "meta_title", "meta_description"}
    for k, v in p.items():
        if k in allowed:
            if k in ("description", "short_description") and isinstance(v, str):
                v = _sanitize_html(v)
            setattr(row, k, v)
    s.add(row)
    s.commit()
    s.refresh(row)
    invalidate_home()
    return row

@admin.delete("/products/{product_id}")
def delete_product(product_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row=s.get(Product,product_id)
    if not row: raise HTTPException(404,"محصول یافت نشد")
    row.is_active=False; s.add(row); s.commit(); return {"ok":True}

@admin.post("/products/{product_id}/related/{related_id}", status_code=201)
def related(product_id: str, related_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    if not s.get(Product, product_id) or not s.get(Product, related_id): raise HTTPException(404,"محصول یافت نشد")
    row=RelatedProduct(product_id=product_id, related_product_id=related_id); s.add(row); s.commit(); return row

@admin.get("/stock-alerts")
def stock_alerts(threshold: int = 5, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    return s.exec(select(Product).where(Product.stock_qty <= threshold, Product.is_active == True)).all()  # noqa

@public.get("/products/{product_id}/related")
def public_related(product_id: str, s: Session = Depends(get_session)):
    ids=s.exec(select(RelatedProduct.related_product_id).where(RelatedProduct.product_id==product_id)).all()
    return s.exec(select(Product).where(Product.id.in_(ids), Product.is_active == True)).all() if ids else []

class ArticleIn(BaseModel):
    title: str; slug: str; body: str; excerpt: str = ""; cover_url: str | None = None; category_id: str | None = None; is_published: bool = False
    is_featured: bool = False
    tag_slugs: list[str] = []
    meta_title: str | None = None
    meta_description: str | None = None


@admin.post("/article-categories", status_code=201)
def create_article_category(data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    if s.exec(select(ArticleCategory).where(ArticleCategory.slug == data["slug"])).first():
        raise HTTPException(409, "slug تکراری است")
    row = ArticleCategory(name=data["name"], slug=data["slug"])
    s.add(row); s.commit(); s.refresh(row); return row


@admin.get("/article-categories")
def article_categories(_: User = Depends(admin_user), s: Session = Depends(get_session)):
    return s.exec(select(ArticleCategory).order_by(ArticleCategory.name)).all()


@admin.patch("/article-categories/{category_id}")
def update_article_category(category_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(ArticleCategory, category_id)
    if not row:
        raise HTTPException(404, "دسته مقاله یافت نشد")
    if "slug" in data and s.exec(select(ArticleCategory).where(ArticleCategory.slug == data["slug"], ArticleCategory.id != category_id)).first():
        raise HTTPException(409, "slug تکراری است")
    for key in ("name", "slug"):
        if key in data:
            setattr(row, key, data[key])
    s.add(row)
    s.commit()
    s.refresh(row)
    return row


@admin.delete("/article-categories/{category_id}")
def delete_article_category(category_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(ArticleCategory, category_id)
    if not row:
        raise HTTPException(404, "دسته مقاله یافت نشد")
    if s.exec(select(Article).where(Article.category_id == category_id)).first():
        raise HTTPException(409, "دسته دارای مقاله است")
    s.delete(row)
    s.commit()
    return {"ok": True}


@admin.get("/articles")
def admin_articles(_: User = Depends(admin_user), s: Session = Depends(get_session)):
    rows = s.exec(select(Article).order_by(Article.created_at.desc())).all()
    cats = {c.id: c.name for c in s.exec(select(ArticleCategory)).all()}
    # cache author names to avoid N+1
    author_ids = {a.author_id for a in rows if a.author_id}
    authors = {u.id: u.full_name for u in session_exec_ids(s, User, author_ids)} if author_ids else {}
    return [
        {
            **{k: getattr(a, k) for k in ("id", "title", "slug", "excerpt", "cover_url", "category_id", "is_published", "is_featured", "published_at", "created_at", "view_count", "reading_time_minutes", "updated_at")},
            "category_name": cats.get(a.category_id) if a.category_id else None,
            "author_name": authors.get(a.author_id) if a.author_id else None,
            "tags": _get_article_tags(s, a.id),
        }
        for a in rows
    ]


def session_exec_ids(session: Session, model, ids: set[str]):
    if not ids:
        return []
    return session.exec(select(model).where(model.id.in_(ids))).all()  # type: ignore[arg-type]


# Article tags admin
@admin.get("/article-tags")
def admin_article_tags(_: User = Depends(admin_user), s: Session = Depends(get_session)):
    return s.exec(select(ArticleTag).order_by(ArticleTag.name)).all()


@admin.post("/article-tags", status_code=201)
def create_article_tag(data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    slug = data.get("slug") or _slugify_local(data.get("name",""))
    if s.exec(select(ArticleTag).where(ArticleTag.slug == slug)).first():
        raise HTTPException(409, "slug تگ تکراری است")
    row = ArticleTag(name=data["name"], slug=slug)
    s.add(row); s.commit(); s.refresh(row); return row


def _slugify_local(value: str) -> str:
    import re as _re
    s = value.strip().lower()
    s = _re.sub(r"[\s\u200c]+", "-", s)
    s = _re.sub(r"[^\w\-]+", "", s, flags=_re.UNICODE)
    s = _re.sub(r"-+", "-", s)
    return s.strip("-") or "tag"


@admin.patch("/article-tags/{tag_id}")
def update_article_tag(tag_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(ArticleTag, tag_id)
    if not row:
        raise HTTPException(404, "تگ یافت نشد")
    if "slug" in data and s.exec(select(ArticleTag).where(ArticleTag.slug == data["slug"], ArticleTag.id != tag_id)).first():
        raise HTTPException(409, "slug تکراری است")
    for k in ("name", "slug"):
        if k in data:
            setattr(row, k, data[k])
    s.add(row); s.commit(); return row


@admin.delete("/article-tags/{tag_id}")
def delete_article_tag(tag_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(ArticleTag, tag_id)
    if not row:
        raise HTTPException(404, "تگ یافت نشد")
    if s.exec(select(ArticleTagLink).where(ArticleTagLink.tag_id == tag_id)).first():
        raise HTTPException(409, "این تگ به مقاله‌ای متصل است")
    s.delete(row); s.commit(); return {"ok": True}

def _sanitize_html(raw: str) -> str:
    """Allowlist-based HTML sanitization for rich-text (article/product body).

    Uses nh3 (ammonia) when available; falls back to regex stripping.
    Allowed tags are those produced by Tiptap toolbar: p/br, strong/em, headings h2-h4,
    lists ul/ol/li, blockquote, a[href], img[src,alt].
    """
    if not raw:
        return ""
    try:
        import nh3  # type: ignore

        allowed_tags = {"p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption", "span", "div"}
        allowed_attrs = {
            "a": {"href", "title", "target", "rel"},
            "img": {"src", "alt", "title", "width", "height"},
            "span": {"class"},
            "div": {"class"},
        }
        # nh3 wants dict[str, set[str]]
        return nh3.clean(
            raw,
            tags=allowed_tags,
            attributes=allowed_attrs,
            url_schemes={"http", "https", "mailto"},
            link_rel=None,
        )
    except Exception:
        import re

        # fallback: strip script/style and on* handlers
        cleaned = re.sub(r"<(script|style|iframe|object|embed|link|meta)[^>]*>.*?</\1>", "", raw, flags=re.IGNORECASE | re.DOTALL)
        cleaned = re.sub(r"<(script|style|iframe|object|embed|link|meta)[^>]*/?>", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s+on\w+\s*=\s*"[^"]*"', "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+on\w+\s*=\s*'[^']*'", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+on\w+\s*=\s*[^\s\"'>]+", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"javascript\s*:", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"data\s*:\s*text/html", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s+style\s*=\s*"[^"]*expression[^"]*"', "", cleaned, flags=re.IGNORECASE)
        return cleaned


@admin.post("/articles", status_code=201)
def create_article(p: ArticleIn, u: User = Depends(admin_user), s: Session = Depends(get_session)):
    if s.exec(select(Article).where(Article.slug == p.slug)).first():
        raise HTTPException(409, "slug تکراری است")
    data = p.model_dump(exclude={"tag_slugs"})
    data["body"] = _sanitize_html(data["body"])
    data["excerpt"] = _sanitize_html(data["excerpt"])
    data["reading_time_minutes"] = _reading_time_minutes(data["body"])
    # handle featured/reading time defaults
    row = Article(**{k: v for k, v in data.items() if k in Article.model_fields}, author_id=u.id)  # type: ignore[arg-type]
    # ensure is_featured etc from payload
    row.is_featured = p.is_featured  # type: ignore[attr-defined]
    row.reading_time_minutes = _reading_time_minutes(p.body)  # type: ignore[attr-defined]
    s.add(row)
    s.commit()
    s.refresh(row)
    _sync_article_tags(s, row.id, p.tag_slugs)
    s.commit()
    invalidate_home()
    # return with tags
    out = row.model_dump()
    out["tags"] = _get_article_tags(s, row.id)
    return out


@admin.patch("/articles/{article_id}")
def update_article(article_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Article, article_id)
    if not row:
        raise HTTPException(404, "مقاله یافت نشد")
    if "slug" in data and s.exec(select(Article).where(Article.slug == data["slug"], Article.id != article_id)).first():
        raise HTTPException(409, "slug تکراری است")
    allowed = {"title", "slug", "body", "excerpt", "cover_url", "category_id", "is_published", "is_featured", "published_at", "meta_title", "meta_description"}
    for key, value in data.items():
        if key in allowed:
            if key in ("body", "excerpt") and isinstance(value, str):
                value = _sanitize_html(value)
            setattr(row, key, value)
    if "body" in data and isinstance(data["body"], str):
        row.reading_time_minutes = _reading_time_minutes(data["body"])  # type: ignore[attr-defined]
    if "tag_slugs" in data and isinstance(data["tag_slugs"], list):
        _sync_article_tags(s, row.id, data["tag_slugs"])
    if data.get("is_published") and row.published_at is None:
        row.published_at = datetime.now(UTC)
    s.add(row)
    s.commit()
    invalidate_home()
    out = row.model_dump()
    out["tags"] = _get_article_tags(s, row.id)
    return out


@admin.delete("/articles/{article_id}")
def delete_article(article_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Article, article_id)
    if not row: raise HTTPException(404, "مقاله یافت نشد")
    s.delete(row); s.commit(); return {"ok": True}


@public.get("/orders/me")
def customer_orders(u: User = Depends(current_user), s: Session = Depends(get_session), offset: int = 0, limit: int = Query(20, le=100)):
    return s.exec(select(Order).where(Order.user_id == u.id).order_by(Order.created_at.desc()).offset(offset).limit(limit)).all()


@admin.get("/orders")
def admin_orders(_: User = Depends(admin_user), s: Session = Depends(get_session), status: str | None = None, offset: int = 0, limit: int = Query(50, le=100)):
    query = select(Order).order_by(Order.created_at.desc())
    if status: query = query.where(Order.status == status)
    return s.exec(query.offset(offset).limit(limit)).all()


@admin.post("/orders/expire-stale")
def expire_stale_orders_admin(_: User = Depends(admin_user), s: Session = Depends(get_session)):
    """Expire pending orders older than 30 minutes and restore stock (Phase 5 TTL)."""
    from app.services.orders import expire_stale_pending_orders

    count = expire_stale_pending_orders(s, ttl_minutes=30)
    return {"expired": count, "message": f"{count} سفارش منقضی و موجودی بازگردانده شد."}


@admin.patch("/orders/{order_id}/status")
def update_order_status(order_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Order, order_id)
    if not row:
        raise HTTPException(404, "سفارش یافت نشد")
    allowed = {"pending", "paid", "processing", "shipped", "delivered", "cancelled"}
    new_status = data.get("status")
    if new_status not in allowed:
        raise HTTPException(400, "وضعیت نامعتبر است")
    current = row.status.value if hasattr(row.status, "value") else str(row.status)
    if new_status == current:
        return row
    if new_status == "cancelled":
        from app.services.orders import cancel_order_and_restock

        cancel_order_and_restock(s, row, note="لغو توسط مدیر (مسیر قدیمی)")
    else:
        from app.services.orders import add_status_history

        row.status = new_status  # type: ignore[assignment]
        s.add(row)
        add_status_history(s, row, new_status, note=f"تغییر وضعیت از {current} توسط مدیر")
    s.commit()
    return row

@public.get("/articles")
def articles(
    s: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(20, le=100),
    category: str | None = None,
    tag: str | None = None,
    search: str | None = None,
    featured: bool | None = None,
):
    filters = [Article.is_published == True]  # noqa: E712
    if category:
        # category may be slug or id
        cat = s.exec(select(ArticleCategory).where(ArticleCategory.slug == category)).first()
        if cat:
            filters.append(Article.category_id == cat.id)
        else:
            filters.append(Article.category_id == category)
    if tag:
        t = s.exec(select(ArticleTag).where(ArticleTag.slug == tag)).first()
        if t:
            ids = [l.article_id for l in s.exec(select(ArticleTagLink).where(ArticleTagLink.tag_id == t.id)).all()]
            if ids:
                filters.append(Article.id.in_(ids))  # type: ignore[arg-type]
            else:
                return []
        else:
            return []
    if search:
        like = f"%{search}%"
        from sqlalchemy import or_ as _or
        filters.append(_or(Article.title.ilike(like), Article.excerpt.ilike(like), Article.body.ilike(like)))
    if featured is not None:
        filters.append(Article.is_featured == featured)
    # featured first then newest
    rows = s.exec(select(Article).where(*filters).order_by(Article.is_featured.desc(), Article.published_at.desc()).offset(offset).limit(limit)).all()  # type: ignore[arg-type]
    # batch fetch categories/authors/tags
    cat_map = {c.id: c.name for c in s.exec(select(ArticleCategory)).all()}
    author_ids = {a.author_id for a in rows if a.author_id}
    authors = {u.id: u for u in s.exec(select(User).where(User.id.in_(list(author_ids)))).all()} if author_ids else {}
    out = []
    for a in rows:
        author = authors.get(a.author_id) if a.author_id else None
        d = a.model_dump()
        d["author_name"] = author.full_name if author else None
        d["author_avatar_url"] = getattr(author, "avatar_url", None) if author else None
        d["category_name"] = cat_map.get(a.category_id) if a.category_id else None
        d["tags"] = _get_article_tags(s, a.id)
        out.append(d)
    return out


@public.get("/articles/{slug}")
def article(slug: str, s: Session = Depends(get_session)):
    row = s.exec(select(Article).where(Article.slug == slug, Article.is_published == True)).first()  # noqa
    if not row:
        raise HTTPException(404, "مقاله یافت نشد")
    # increment view count
    try:
        row.view_count = (row.view_count or 0) + 1  # type: ignore[attr-defined]
        s.add(row)
        s.commit()
        s.refresh(row)
    except Exception:
        pass
    author = s.get(User, row.author_id) if row.author_id else None
    d = row.model_dump()
    d["author_name"] = author.full_name if author else None
    d["author_avatar_url"] = getattr(author, "avatar_url", None) if author else None
    if row.category_id:
        cat = s.get(ArticleCategory, row.category_id)
        d["category_name"] = cat.name if cat else None
        # related articles (same category, exclude self)
        try:
            related = s.exec(
                select(Article).where(Article.category_id == row.category_id, Article.is_published == True, Article.id != row.id).order_by(Article.published_at.desc()).limit(4)  # type: ignore[arg-type]
            ).all()
            d["related"] = [
                {"id": r.id, "title": r.title, "slug": r.slug, "excerpt": r.excerpt, "cover_url": r.cover_url, "published_at": r.published_at}
                for r in related
            ]
        except Exception:
            d["related"] = []
    else:
        d["related"] = []
    d["tags"] = _get_article_tags(s, row.id)
    return d


@public.get("/article-tags")
def public_article_tags(s: Session = Depends(get_session)):
    return s.exec(select(ArticleTag).order_by(ArticleTag.name)).all()


@public.get("/article-categories")
def public_article_categories(s: Session = Depends(get_session)):
    return s.exec(select(ArticleCategory).order_by(ArticleCategory.name)).all()

@admin.post("/settings")
def set_setting(data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    key=data.get("key"); row=s.exec(select(Setting).where(Setting.key==key)).first()
    if row: row.value=str(data.get("value","")); row.value_type=data.get("value_type","string")
    else: row=Setting(key=key,value=str(data.get("value","")),value_type=data.get("value_type","string"))
    s.add(row); s.commit(); return row

@public.get("/settings/{key}")
def get_setting(key: str, s: Session = Depends(get_session)):
    row=s.exec(select(Setting).where(Setting.key==key)).first()
    if not row: raise HTTPException(404,"تنظیمات یافت نشد")
    try: return {"key":key,"value":json.loads(row.value)}
    except Exception: return {"key":key,"value":row.value}

@public.get("/shipping-methods")
def public_shipping_methods(s: Session = Depends(get_session)):
    """Active shipping methods for storefront checkout (no auth required)."""
    return s.exec(
        select(ShippingMethod).where(ShippingMethod.is_active == True).order_by(ShippingMethod.sort_order)  # noqa: E712
    ).all()


@public.get("/notifications")
def notifications(u: User=Depends(current_user), s: Session=Depends(get_session)):
    return s.exec(select(Notification).where(Notification.user_id==u.id).order_by(Notification.created_at.desc())).all()

@public.post("/notifications/{notification_id}/read")
def mark_read(notification_id: str, u: User=Depends(current_user), s: Session=Depends(get_session)):
    row=s.get(Notification,notification_id)
    if not row or row.user_id!=u.id: raise HTTPException(404,"اعلان یافت نشد")
    row.is_read=True; s.add(row); s.commit(); return {"ok":True}

@admin.get("/activity")
def activity(_: User=Depends(admin_user), s: Session=Depends(get_session), limit:int=Query(100,le=500)):
    return s.exec(select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit)).all()

@admin.get("/analytics")
def analytics(_: User=Depends(admin_user), s: Session=Depends(get_session)):
    from sqlalchemy import func
    return {"orders": s.exec(select(func.count(Order.id))).one(), "revenue": s.exec(select(func.coalesce(func.sum(Order.total_amount),0)).where(Order.status!="cancelled")).one()}
