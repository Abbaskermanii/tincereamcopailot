"""Seed the database with Persian catalog data (idempotent)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import Session, func, select

from app.db.session import engine
from app.core.permissions import ROLE_PRESETS
from app.core.security import hash_password
from app.core.config import get_settings
from app.models import (
    Carousel,
    Category,
    Coupon,
    DiscountType,
    FAQItem,
    HomepageSection,
    Product,
    ProductImage,
    Role,
    ShippingMethod,
    StaticPage,
    User,
)
from app.services.storage import put_image
from scripts.seed_data import build_rows


def seed(session: Session) -> None:
    rows = build_rows()

    category_by_slug: dict[str, Category] = {}
    for cat in rows["categories"]:
        existing = session.exec(
            select(Category).where(Category.slug == cat["slug"])  # type: ignore[arg-type]
        ).first()
        if existing:
            category_by_slug[cat["slug"]] = existing  # type: ignore[index]
            continue
        obj = Category(**cat)
        session.add(obj)
        category_by_slug[cat["slug"]] = obj

    session.flush()

    product_by_slug: dict[str, Product] = {}
    for prod in rows["products"]:
        existing = session.exec(
            select(Product).where(Product.slug == prod["slug"])  # type: ignore[arg-type]
        ).first()
        if existing:
            product_by_slug[prod["slug"]] = existing  # type: ignore[assignment]
            continue
        cat = category_by_slug[prod["category_slug"]]
        obj = Product(**{k: v for k, v in prod.items() if k != "category_slug"}, category_id=cat.id)
        session.add(obj)
        product_by_slug[prod["slug"]] = obj

    session.flush()

    for img in rows["images"]:
        original_url = img["url"]
        exists = session.exec(
            select(ProductImage).where(ProductImage.url == original_url)  # type: ignore[arg-type]
        ).first()
        if exists:
            continue
        product = product_by_slug[img.pop("product_slug")]
        if original_url.startswith("/products/"):
            object_name = f"seed/{original_url.rsplit('/', 1)[-1]}"
            svg = (
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">'
                '<rect width="800" height="800" fill="#EDEAE3"/>'
                '<circle cx="400" cy="400" r="220" fill="#31547A"/>'
                "</svg>"
            ).encode()
            img["url"] = put_image(object_name, svg, "image/svg+xml")
        session.add(ProductImage(product_id=product.id, **img))

    for cpn in rows["coupons"]:
        exists = session.exec(
            select(Coupon).where(Coupon.code == cpn["code"])  # type: ignore[arg-type]
        ).first()
        if exists:
            continue
        payload = {**cpn}
        dtype = payload.pop("discount_type")
        session.add(Coupon(discount_type=DiscountType(dtype), **payload))

    for cs in rows.get("carousels", []):
        original_url = cs["image_url"]
        exists = session.exec(
            select(Carousel).where(Carousel.image_url == original_url)  # type: ignore[arg-type]
        ).first()
        if exists:
            continue
        if original_url.startswith("/carousel/"):
            object_name = f"seed/{original_url.rsplit('/', 1)[-1]}"
            svg = (
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500">'
                '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
                '<stop offset="0%" stop-color="#31547A"/><stop offset="100%" stop-color="#7A9E93"/>'
                '</linearGradient></defs>'
                '<rect width="1200" height="500" fill="url(#g)"/>'
                '<circle cx="600" cy="250" r="120" fill="#EDEAE3" opacity="0.3"/>'
                '<text x="600" y="260" text-anchor="middle" font-family="sans-serif" font-size="36" fill="white" opacity="0.8">Tinceram</text>'
                "</svg>"
            ).encode()
            image_url = put_image(object_name, svg, "image/svg+xml")
        else:
            image_url = original_url
        session.add(Carousel(
            title=cs["title"],
            subtitle=cs.get("subtitle"),
            image_url=image_url,
            link_url=cs.get("link_url"),
            sort_order=cs.get("sort_order", 0),
        ))

    _seed_ops_data(session)
    session.commit()


def _seed_ops_data(session: Session) -> None:
    """Idempotent bootstrap: roles, admin account, shipping methods, pages, FAQ."""

    def first(model, **kw):
        return session.exec(select(model).where(*[(getattr(model, k) == v) for k, v in kw.items()])).first()

    # roles
    for preset in ROLE_PRESETS:
        role = first(Role, name=preset["name"])
        if not role:
            session.add(Role(name=preset["name"], permissions=",".join(preset["permissions"])))

    # superadmin account from settings
    s = get_settings()
    admin_role = first(Role, name="superadmin")
    user = first(User, email=s.seed_admin_email)
    if not user:
        user = User(
            email=s.seed_admin_email,
            password_hash=hash_password(s.seed_admin_password),
            full_name="مدیر فروشگاه",
            is_admin=True,
            role_id=admin_role.id if admin_role else None,
        )
        session.add(user)
    elif not user.is_admin:
        user.is_admin = True
        user.role_id = admin_role.id if admin_role else user.role_id
        session.add(user)

    # shipping methods
    methods = [
        dict(name="پست پیشتاز (سراسر کشور)", code="pishtaz", cost=55000, free_over_amount=3000000,
             estimated_days_min=2, estimated_days_max=5, sort_order=1),
        dict(name="پست سفارشی", code="post-sefareshi", cost=38000, free_over_amount=None,
             estimated_days_min=3, estimated_days_max=7, sort_order=2),
        dict(name="تیپاکس (پس‌کرایه)", code="tipax", cost=0, free_over_amount=None,
             estimated_days_min=1, estimated_days_max=3, sort_order=3),
        dict(name="تحویل حضوری در فروشگاه", code="pickup", cost=0, free_over_amount=None,
             estimated_days_min=0, estimated_days_max=1, sort_order=4),
    ]
    for m in methods:
        if not first(ShippingMethod, code=m["code"]):
            session.add(ShippingMethod(**m))

    # static pages
    pages = [
        dict(title="درباره تن‌سِرام", slug="about", content="<p>تن‌سِرام فروشگاه صنایع دستی سرامیکی است.</p>", is_published=True, sort_order=1),
        dict(title="شرایط استفاده", slug="terms", content="<p>با استفاده از سایت شرایط را می‌پذیرید.</p>", is_published=True, sort_order=2),
        dict(title="حریم خصوصی", slug="privacy-policy", content="<p>اطلاعات شما محفوظ است.</p>", is_published=True, sort_order=3),
        dict(title="قوانین مرجوعی", slug="returns-policy", content="<p>تا ۷ روز امکان مرجوعی وجود دارد.</p>", is_published=True, sort_order=4),
    ]
    for pg in pages:
        if not first(StaticPage, slug=pg["slug"]):
            session.add(StaticPage(**pg))

    faqs = [
        ("سفارش من چه زمانی ارسال می‌شود؟", "سفارش‌ها حداکثر تا ۲ روز کاری پس از تأیید پرداخت ارسال می‌شوند.", "ارسال", 1),
        ("امکان مرجوع کردن کالا وجود دارد؟", "بله، تا ۷ روز پس از تحویل می‌توانید درخواست مرجوعی ثبت کنید.", "مرجوعی", 2),
        ("هزینه ارسال چقدر است؟", "هزینه ارسال به روش ارسال انتخابی بستگی دارد و در صفحه پرداخت نمایش داده می‌شود.", "ارسال", 3),
        ("آیا محصولات دست‌ساز هستند؟", "بله، تمام محصولات تن‌سِرام به‌صورت دستی ساخته و لعاب‌کاری می‌شوند.", "محصولات", 4),
    ]
    existing_faqs = session.exec(select(func.count()).select_from(FAQItem.__table__)).one()
    if not existing_faqs:
        for q, a, cat, order in faqs:
            session.add(FAQItem(question=q, answer=a, category=cat, sort_order=order))

    # homepage layout (only on first run)
    existing_sections = session.exec(select(func.count()).select_from(HomepageSection.__table__)).one()
    if not existing_sections:
        from app.services.homepage import default_sections
        for section in default_sections():
            session.add(section)


def is_seeded(session: Session) -> bool:
    result = session.exec(select(Product).limit(1)).one_or_none()
    return result is not None


if __name__ == "__main__":
    with Session(engine) as s:
        seed(s)
        print("seed complete")
