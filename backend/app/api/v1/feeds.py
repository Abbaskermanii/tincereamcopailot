"""XML product feeds: Torob & Google Merchant Center (same source data)."""

from datetime import datetime
from app.compat import UTC
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, Response
from sqlmodel import Session, select

from app.core.config import get_settings
from app.db.session import get_session
from app.models import Category, Product, ProductImage, ShippingMethod

router = APIRouter()


def _active_products(
    session: Session,
) -> list[tuple[Product, Category | None, ProductImage | None]]:
    products = session.exec(
        select(Product)
        .where(Product.is_active == True)  # noqa: E712
        .order_by(Product.created_at.desc())  # type: ignore[arg-type]
    ).all()
    out = []
    for p in products:
        cat = session.get(Category, p.category_id)
        out.append((p, cat, p.primary_image))
    return out


def _abs_url(path_or_url: str) -> str:
    if path_or_url.startswith("http"):
        return path_or_url
    return f"{get_settings().next_public_site_url}{path_or_url}"


@router.get("/feed/torob", response_class=Response)
async def torob_feed(session: Session = Depends(get_session)) -> Response:
    rows = _active_products(session)
    items = []
    for p, _cat, img in rows:
        image_url = _abs_url(img.url) if img else ""
        items.append(
            f"""
    <product>
        <id>{escape(p.sku)}</id>
        <title>{escape(p.name)}</title>
        <price>{int(p.price)}</price>
        <old_price>{int(p.compare_at_price) if p.compare_at_price else ''}</old_price>
        <image_link>{escape(image_url)}</image_link>
        <link>{escape(_abs_url(f'/product/{p.slug}'))}</link>
        <availability>{'in_stock' if p.stock_qty > 0 else 'out_of_stock'}</availability>
        <category>خانگی و آشپزخانه</category>
    </product>"""
        )

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<products>{''.join(items)}
</products>"""
    return Response(content=xml, media_type="application/xml; charset=utf-8")


@router.get("/feed/google-merchant", response_class=Response)
async def google_feed(session: Session = Depends(get_session)) -> Response:
    s = get_settings()
    rows = _active_products(session)
    now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S%z")
    # Get default shipping cost from database
    shipping = session.exec(select(ShippingMethod).where(ShippingMethod.is_active == True).limit(1)).first()  # type: ignore[arg-type]
    default_shipping_cost = int(shipping.cost) if shipping else 55000
    items = []
    for p, cat, img in rows:
        image_url = _abs_url(img.url) if img else ""
        condition = "new"
        availability = "in stock" if p.stock_qty > 0 else "out of stock"
        title = f"{p.name} | تن‌سِرام"
        items.append(
            f"""
    <item>
        <g:id>{escape(p.sku)}</g:id>
        <g:title>{escape(title)}</g:title>
        <g:description>{escape((p.short_description or p.description)[:480])}</g:description>
        <g:link>{escape(_abs_url(f'/product/{p.slug}'))}</g:link>
        <g:image_link>{escape(image_url)}</g:image_link>
        <g:condition>{condition}</g:condition>
        <g:availability>{availability}</g:availability>
        <g:price>{int(p.price)} IRT</g:price>
        {f'<g:sale_price>{int(p.price)} IRT</g:sale_price>' if p.discount_percent else ''}
        <g:brand>TinCeram</g:brand>
        <g:identifier_exists>no</g:identifier_exists>
        <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp;
        Dining</g:google_product_category>
        <g:product_type>{escape(cat.name if cat else '')}</g:product_type>
        <g:shipping_weight>{p.weight_grams} g</g:shipping_weight>
        <g:shipping>
            <g:country>IR</g:country>
            <g:service>Standard</g:service>
            <g:price>{default_shipping_cost} IRT</g:price>
        </g:shipping>
    </item>"""
        )

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
    <title>تن‌سِرام — فروشگاه سرامیک دست‌ساز</title>
    <link>{s.next_public_site_url}</link>
    <description>سفال و سرامیک دست‌ساز ایرانی</description>
    <last_build_date>{now}</last_build_date>
    {''.join(items)}
</channel>
</rss>"""
    return Response(content=xml, media_type="application/rss+xml; charset=utf-8")
