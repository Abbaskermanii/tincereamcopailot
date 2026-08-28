"""Seed the database with Persian catalog data (idempotent)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import Session, func, select

from app.db.session import engine
from app.models import Category, Coupon, DiscountType, Product, ProductImage
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

    session.commit()


def is_seeded(session: Session) -> bool:
    count = session.exec(select(func.count()).select_from(Product)).one()
    return bool(count)


if __name__ == "__main__":
    with Session(engine) as s:
        seed(s)
        print("seed complete")
