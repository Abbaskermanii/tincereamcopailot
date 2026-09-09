import json
import secrets
from datetime import datetime
from app.compat import UTC
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import *
from app.api.v1.auth import admin_user, current_user
from app.services.storage import put_image

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
    row = Carousel(**data); s.add(row); s.commit(); s.refresh(row); return row


@admin.get("/carousels")
def admin_carousels(_: User = Depends(admin_user), s: Session = Depends(get_session)):
    return s.exec(select(Carousel).order_by(Carousel.sort_order)).all()


@admin.patch("/carousels/{carousel_id}")
def update_carousel(carousel_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Carousel, carousel_id)
    if not row: raise HTTPException(404, "بنر یافت نشد")
    for key, value in data.items():
        if hasattr(row, key): setattr(row, key, value)
    s.add(row); s.commit(); return row


@admin.delete("/carousels/{carousel_id}")
def delete_carousel(carousel_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Carousel, carousel_id)
    if not row: raise HTTPException(404, "بنر یافت نشد")
    s.delete(row); s.commit(); return {"ok": True}


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
    compare_at_price: float | None = None

@admin.post("/products", status_code=201)
def create_product(p: ProductIn, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    if s.exec(select(Product).where((Product.slug == p.slug) | (Product.sku == p.sku))).first():
        raise HTTPException(409, "slug یا SKU تکراری است")
    row = Product(**p.model_dump()); s.add(row); s.commit(); s.refresh(row); return row

@admin.get("/products")
def products(_: User = Depends(admin_user), s: Session = Depends(get_session), offset: int = 0, limit: int = Query(50, le=100)):
    return s.exec(select(Product).offset(offset).limit(limit)).all()

@admin.get("/products/{product_id}")
def get_product_admin(product_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    """Full product detail for the admin editor."""
    row = s.get(Product, product_id)
    if not row:
        raise HTTPException(404, "محصول یافت نشد")
    return {
        "id": row.id, "name": row.name, "slug": row.slug, "sku": row.sku,
        "category_id": row.category_id,
        "price": float(row.price),
        "compare_at_price": float(row.compare_at_price) if row.compare_at_price else None,
        "stock_qty": row.stock_qty, "is_active": row.is_active,
        "description": row.description, "short_description": row.short_description,
        "material": row.material, "dimensions": row.dimensions,
        "weight_grams": row.weight_grams,
        "meta_title": row.meta_title, "meta_description": row.meta_description,
        "created_at": row.created_at,
    }


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
    allowed = {"name", "slug", "category_id", "description", "short_description", "price", "compare_at_price", "stock_qty", "sku", "weight_grams", "material", "dimensions", "is_active", "meta_title", "meta_description"}
    for k, v in p.items():
        if k in allowed:
            setattr(row, k, v)
    s.add(row)
    s.commit()
    s.refresh(row)
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
def stock_alerts(threshold: int = 5, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    return s.exec(select(Product).where(Product.stock_qty <= threshold, Product.is_active == True)).all()  # noqa

@public.get("/products/{product_id}/related")
def public_related(product_id: str, s: Session = Depends(get_session)):
    ids=s.exec(select(RelatedProduct.related_product_id).where(RelatedProduct.product_id==product_id)).all()
    return s.exec(select(Product).where(Product.id.in_(ids), Product.is_active == True)).all() if ids else []

class ArticleIn(BaseModel):
    title: str; slug: str; body: str; excerpt: str = ""; cover_url: str | None = None; category_id: str | None = None; is_published: bool = False; meta_title: str | None = None; meta_description: str | None = None
    tags: str = ""


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
    author_ids = [a.author_id for a in rows if a.author_id]
    authors = {u.id: u for u in s.exec(select(User).where(User.id.in_(author_ids))).all()} if author_ids else {}
    return [
        {
            **{k: getattr(a, k) for k in ("id", "title", "slug", "excerpt", "cover_url", "category_id", "is_published", "published_at", "created_at", "updated_at", "meta_title", "meta_description")},
            "category_name": cats.get(a.category_id) if a.category_id else None,
            "author_name": (authors[a.author_id].full_name or authors[a.author_id].email) if a.author_id and a.author_id in authors else None,
        }
        for a in rows
    ]


@admin.get("/articles/{article_id}")
def get_article_admin(article_id: str, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Article, article_id)
    if not row:
        raise HTTPException(404, "مقاله یافت نشد")
    author = s.get(User, row.author_id) if row.author_id else None
    cat = s.get(ArticleCategory, row.category_id) if row.category_id else None
    return {
        "id": row.id,
        "title": row.title,
        "slug": row.slug,
        "excerpt": row.excerpt,
        "body": row.body,
        "cover_url": row.cover_url,
        "category_id": row.category_id,
        "category_name": cat.name if cat else None,
        "is_published": row.is_published,
        "published_at": row.published_at,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
        "meta_title": row.meta_title,
        "meta_description": row.meta_description,
        "tags": getattr(row, "tags", ""),
        "author_id": row.author_id,
        "author_name": (author.full_name or author.email) if author else None,
    }


def _sanitize_html(raw: str) -> str:
    """Minimal sanitization for Article.body — strip script/style and on* handlers."""
    import re

    # Remove script/style/iframe/object/embed tags and content
    cleaned = re.sub(r"<(script|style|iframe|object|embed|link|meta)[^>]*>.*?</\1>", "", raw, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"<(script|style|iframe|object|embed|link|meta)[^>]*/?>", "", cleaned, flags=re.IGNORECASE)
    # Remove event handlers like onclick= (quoted, single-quoted, and unquoted)
    cleaned = re.sub(r"\s+on\w+\s*=\s*\"[^\"]*\"", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+on\w+\s*=\s*'[^']*'", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+on\w+\s*=\s*[^\s\"'>]+", "", cleaned, flags=re.IGNORECASE)
    # Remove javascript: and data: URLs
    cleaned = re.sub(r"javascript\s*:", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"data\s*:\s*text/html", "", cleaned, flags=re.IGNORECASE)
    # Remove style attributes with expression() or javascript:
    cleaned = re.sub(r"\s+style\s*=\s*\"[^\"]*expression[^\"]*\"", "", cleaned, flags=re.IGNORECASE)
    return cleaned


@admin.post("/articles", status_code=201)
def create_article(p: ArticleIn, u: User = Depends(admin_user), s: Session = Depends(get_session)):
    if s.exec(select(Article).where(Article.slug == p.slug)).first():
        raise HTTPException(409, "slug تکراری است")
    data = p.model_dump()
    data["body"] = _sanitize_html(data["body"])
    data["excerpt"] = _sanitize_html(data["excerpt"])
    row = Article(**data, author_id=u.id)
    s.add(row)
    s.commit()
    s.refresh(row)
    return row


@admin.patch("/articles/{article_id}")
def update_article(article_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Article, article_id)
    if not row:
        raise HTTPException(404, "مقاله یافت نشد")
    if "slug" in data and s.exec(select(Article).where(Article.slug == data["slug"], Article.id != article_id)).first():
        raise HTTPException(409, "slug تکراری است")
    allowed = {"title", "slug", "body", "excerpt", "cover_url", "category_id", "is_published", "published_at", "tags", "meta_title", "meta_description"}
    for key, value in data.items():
        if key in allowed:
            if key in ("body", "excerpt") and isinstance(value, str):
                value = _sanitize_html(value)
            setattr(row, key, value)
    if data.get("is_published") and row.published_at is None:
        row.published_at = datetime.now(UTC)
    s.add(row)
    s.commit()
    return row


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

def _split_tags(raw: str | None) -> list[str]:
    """'لقاب، دست‌ساز، کرج' -> ['لقاب', 'دست‌ساز', 'کرج'] (commas + arabic comma)."""
    import re as _re
    if not raw:
        return []
    return [t.strip() for t in _re.split(r"[,،]", raw) if t.strip()]


@public.get("/articles")
def articles(s: Session = Depends(get_session), offset: int=0, limit: int=Query(20,le=100)):
    rows = s.exec(select(Article).where(Article.is_published==True).order_by(Article.published_at.desc()).offset(offset).limit(limit)).all() # noqa
    if not rows:
        return []
    author_ids = [a.author_id for a in rows if a.author_id]
    authors = {u.id: u for u in s.exec(select(User).where(User.id.in_(author_ids))).all()} if author_ids else {}
    cat_ids = [a.category_id for a in rows if a.category_id]
    cats = {c.id: c.name for c in s.exec(select(ArticleCategory).where(ArticleCategory.id.in_(cat_ids))).all()} if cat_ids else {}
    return [
        {
            "id": a.id,
            "title": a.title,
            "slug": a.slug,
            "excerpt": a.excerpt,
            "cover_url": a.cover_url,
            "published_at": a.published_at,
            "category_name": cats.get(a.category_id) if a.category_id else None,
            "author_name": (authors[a.author_id].full_name or authors[a.author_id].email) if a.author_id and a.author_id in authors else None,
            "author_avatar_url": authors[a.author_id].avatar_url if a.author_id and a.author_id in authors else None,
            "reading_time_minutes": max(1, len(a.body) // 800) if a.body else 1,
            "tags": _split_tags(getattr(a, "tags", "")),
        }
        for a in rows
    ]


@public.get("/article-categories")
def public_article_categories(s: Session = Depends(get_session)):
    cats = s.exec(select(ArticleCategory).order_by(ArticleCategory.name)).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug} for c in cats]

@public.get("/articles/{slug}")
def article(slug: str, s: Session = Depends(get_session)):
    row=s.exec(select(Article).where(Article.slug==slug, Article.is_published==True)).first() # noqa
    if not row: raise HTTPException(404,"مقاله یافت نشد")
    author = s.get(User, row.author_id) if row.author_id else None
    cat = s.get(ArticleCategory, row.category_id) if row.category_id else None
    return {
        "id": row.id,
        "title": row.title,
        "slug": row.slug,
        "excerpt": row.excerpt,
        "body": row.body,
        "cover_url": row.cover_url,
        "published_at": row.published_at,
        "updated_at": row.updated_at,
        "meta_title": row.meta_title,
        "meta_description": row.meta_description,
        "category_name": cat.name if cat else None,
        "author_name": (author.full_name or author.email) if author else None,
        "author_avatar_url": author.avatar_url if author else None,
        "reading_time_minutes": max(1, len(row.body) // 800) if row.body else 1,
        "tags": _split_tags(getattr(row, "tags", "")),
    }

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

