import json
import secrets
from datetime import UTC, datetime
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
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}: raise HTTPException(415, "فرمت تصویر پشتیبانی نمی‌شود")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024: raise HTTPException(413, "حجم تصویر زیاد است")
    extension = (file.filename or "image").rsplit(".", 1)[-1].lower()
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
    description: str = ""; stock_qty: int = 0; is_active: bool = True

@admin.post("/products", status_code=201)
def create_product(p: ProductIn, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    if s.exec(select(Product).where((Product.slug == p.slug) | (Product.sku == p.sku))).first():
        raise HTTPException(409, "slug یا SKU تکراری است")
    row = Product(**p.model_dump()); s.add(row); s.commit(); s.refresh(row); return row

@admin.get("/products")
def products(_: User = Depends(admin_user), s: Session = Depends(get_session), offset: int = 0, limit: int = Query(50, le=100)):
    return s.exec(select(Product).offset(offset).limit(limit)).all()

@admin.patch("/products/{product_id}")
def update_product(product_id: str, p: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Product, product_id)
    if not row: raise HTTPException(404, "محصول یافت نشد")
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
    for k,v in p.items():
        if hasattr(row,k): setattr(row,k,v)
    s.add(row); s.commit(); s.refresh(row); return row

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
    title: str; slug: str; body: str; excerpt: str = ""; category_id: str | None = None; is_published: bool = False


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
    return s.exec(select(Article).order_by(Article.created_at.desc())).all()

@admin.post("/articles", status_code=201)
def create_article(p: ArticleIn, u: User = Depends(admin_user), s: Session = Depends(get_session)):
    if s.exec(select(Article).where(Article.slug == p.slug)).first():
        raise HTTPException(409, "slug تکراری است")
    row=Article(**p.model_dump(), author_id=u.id); s.add(row); s.commit(); s.refresh(row); return row


@admin.patch("/articles/{article_id}")
def update_article(article_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Article, article_id)
    if not row: raise HTTPException(404, "مقاله یافت نشد")
    if "slug" in data and s.exec(select(Article).where(Article.slug == data["slug"], Article.id != article_id)).first():
        raise HTTPException(409, "slug تکراری است")
    for key, value in data.items():
        if hasattr(row, key): setattr(row, key, value)
    if data.get("is_published") and row.published_at is None: row.published_at = datetime.now(UTC)
    s.add(row); s.commit(); return row


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


@admin.patch("/orders/{order_id}/status")
def update_order_status(order_id: str, data: dict, _: User = Depends(admin_user), s: Session = Depends(get_session)):
    row = s.get(Order, order_id)
    if not row: raise HTTPException(404, "سفارش یافت نشد")
    allowed = {"pending", "paid", "processing", "shipped", "delivered", "cancelled"}
    if data.get("status") not in allowed: raise HTTPException(400, "وضعیت نامعتبر است")
    row.status = data["status"]; s.add(row); s.commit(); return row

@public.get("/articles")
def articles(s: Session = Depends(get_session), offset: int=0, limit: int=Query(20,le=100)):
    return s.exec(select(Article).where(Article.is_published==True).order_by(Article.published_at.desc()).offset(offset).limit(limit)).all() # noqa

@public.get("/articles/{slug}")
def article(slug: str, s: Session = Depends(get_session)):
    row=s.exec(select(Article).where(Article.slug==slug, Article.is_published==True)).first() # noqa
    if not row: raise HTTPException(404,"مقاله یافت نشد")
    return row

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

@public.post("/newsletter")
def newsletter(email: str, s: Session = Depends(get_session)):
    row=s.exec(select(NewsletterSubscription).where(NewsletterSubscription.email==email.lower())).first()
    if row: row.unsubscribed_at=None; row.consent=True
    else: row=NewsletterSubscription(email=email.lower())
    s.add(row); s.commit(); return {"ok":True}

@public.delete("/newsletter/{email}")
def unsubscribe(email: str, s: Session = Depends(get_session)):
    row=s.exec(select(NewsletterSubscription).where(NewsletterSubscription.email==email.lower())).first()
    if row: row.unsubscribed_at=datetime.now(UTC); s.add(row); s.commit()
    return {"ok":True}

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
