"""Resolve the admin-configured homepage into storefront-ready payloads.

One cached call serves the whole homepage; every admin mutation that can
change the page calls `invalidate_home()`.
"""

import json
from datetime import datetime
from app.compat import UTC

from sqlalchemy import func, text
from sqlmodel import Session, select

from app.models import (
    Article,
    ArticleCategory,
    Carousel,
    Category,
    FAQItem,
    HomepageSection,
    HomepageSectionKind,
    Product,
    ProductSource,
    User,
)
from app.services.cache import cache_delete_pattern, cache_get_json, cache_set_json

CACHE_KEY = "homepage:payload"


def invalidate_home() -> None:
    cache_delete_pattern("homepage:*")


def _product_card(p: Product) -> dict:
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
        "discount_percent": p.discount_percent,
    }


def _base_filters() -> list:
    return [Product.is_active == True]  # noqa: E712


def _products_for(session: Session, section: HomepageSection) -> list[dict]:
    limit = section.limit_count
    source = section.source

    if source == ProductSource.manual:
        ids = section.manual_ids()
        if not ids:
            return []
        rows = session.exec(
            select(Product)
            .where(Product.id.in_(ids), *_base_filters())  # type: ignore[arg-type]
        ).all()
        by_id = {p.id: p for p in rows}
        return [_product_card(by_id[i]) for i in ids if i in by_id][:limit]

    if source == ProductSource.new_arrivals:
        rows = session.exec(
            select(Product).where(*_base_filters()).order_by(Product.created_at.desc()).limit(limit)  # type: ignore[arg-type]
        ).all()
        return [_product_card(p) for p in rows]

    if source == ProductSource.popular:
        rows = session.exec(
            select(Product).where(*_base_filters())
            .order_by(Product.view_count.desc(), Product.created_at.desc())  # type: ignore[arg-type]
            .limit(limit)
        ).all()
        return [_product_card(p) for p in rows]

    if source == ProductSource.discounted:
        rows = session.exec(
            select(Product)
            .where(*_base_filters(), Product.compare_at_price != None, Product.compare_at_price > Product.price)  # noqa: E711, E712
            .order_by(((1 - Product.price / Product.compare_at_price) * 100).desc())  # type: ignore[operator]
            .limit(limit)
        ).all()
        return [_product_card(p) for p in rows]

    if source == ProductSource.category and section.category_id:
        category_ids = [section.category_id]
        children = session.exec(
            select(Category.id).where(Category.parent_id == section.category_id)  # type: ignore[arg-type]
        ).all()
        category_ids += list(children)
        rows = session.exec(
            select(Product)
            .where(*_base_filters(), Product.category_id.in_(category_ids))  # type: ignore[arg-type]
            .order_by(Product.created_at.desc())
            .limit(limit)
        ).all()
        return [_product_card(p) for p in rows]

    # best_sellers (default): most units sold in non-cancelled orders
    sold = session.exec(
        text(
            "SELECT oi.product_id, SUM(oi.quantity) AS qty FROM order_items oi "
            "JOIN orders o ON o.id = oi.order_id "
            "WHERE o.status != 'cancelled' GROUP BY oi.product_id ORDER BY qty DESC LIMIT :lim"
        ).bindparams(lim=limit)
    ).all()
    sold_ids = [r[0] for r in sold]
    rows = session.exec(
        select(Product).where(Product.id.in_(sold_ids), *_base_filters())  # type: ignore[arg-type]
    ).all() if sold_ids else []
    by_id = {p.id: p for p in rows}
    ordered = [by_id[i] for i in sold_ids if i in by_id]
    if not ordered:  # fresh store with no sales yet → fall back to newest
        rows = session.exec(
            select(Product).where(*_base_filters()).order_by(Product.created_at.desc()).limit(limit)  # type: ignore[arg-type]
        ).all()
        ordered = list(rows)
    return [_product_card(p) for p in ordered]


def _section_payload(session: Session, s: HomepageSection) -> dict:
    payload: dict = {
        "id": s.id,
        "kind": s.kind.value,
        "title": s.title,
        "subtitle": s.subtitle,
        "sort_order": s.sort_order,
    }
    if s.kind == HomepageSectionKind.products:
        payload["source"] = s.source.value if s.source else None
        payload["products"] = _products_for(session, s)
    elif s.kind == HomepageSectionKind.hero:
        now = datetime.now(UTC)
        slides = session.exec(
            select(Carousel).where(
                Carousel.is_active == True,  # noqa: E712
                (Carousel.starts_at == None) | (Carousel.starts_at <= now),  # noqa: E711
                (Carousel.ends_at == None) | (Carousel.ends_at >= now),  # noqa: E711
            ).order_by(Carousel.sort_order)
        ).all()
        payload["slides"] = [
            {
                "id": c.id,
                "title": c.title,
                "subtitle": c.subtitle,
                "image_url": c.image_url,
                "link_url": c.link_url,
            }
            for c in slides
        ]
    elif s.kind == HomepageSectionKind.categories:
        cats = session.exec(
            select(Category).where(Category.parent_id == None).order_by(Category.name)  # noqa: E711
        ).all()
        counts = {
            r[0]: int(r[1])
            for r in session.exec(
                select(Product.category_id, func.count(Product.id))
                .where(Product.is_active == True)  # noqa: E712
                .group_by(Product.category_id)
            ).all()
        }
        payload["categories"] = [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "image_url": c.image_url,
                "product_count": counts.get(c.id, 0),
            }
            for c in cats
        ][: s.limit_count]
    elif s.kind == HomepageSectionKind.articles:
        rows = session.exec(
            select(Article)
            .where(Article.is_published == True)  # noqa: E712
            .order_by(Article.published_at.desc())
            .limit(s.limit_count)
        ).all()
        author_ids = [a.author_id for a in rows if a.author_id]
        authors = {u.id: u for u in session.exec(select(User).where(User.id.in_(author_ids))).all()} if author_ids else {}
        cat_ids = [a.category_id for a in rows if a.category_id]
        cats = {c.id: c.name for c in session.exec(select(ArticleCategory).where(ArticleCategory.id.in_(cat_ids))).all()} if cat_ids else {}
        payload["articles"] = [
            {
                "id": a.id,
                "title": a.title,
                "slug": a.slug,
                "excerpt": a.excerpt,
                "published_at": a.published_at,
                "cover_url": a.cover_url,
                "category_name": cats.get(a.category_id) if a.category_id else None,
                "author_name": (authors[a.author_id].full_name or authors[a.author_id].email) if a.author_id and a.author_id in authors else None,
                "author_avatar_url": authors[a.author_id].avatar_url if a.author_id and a.author_id in authors else None,
                "reading_time_minutes": max(1, len(a.body) // 800) if a.body else 1,
            }
            for a in rows
        ]
    elif s.kind == HomepageSectionKind.faq:
        rows = session.exec(
            select(FAQItem)
            .where(FAQItem.is_active == True)  # noqa: E712
            .order_by(FAQItem.sort_order)
            .limit(s.limit_count)
        ).all()
        payload["faq"] = [
            {"id": f.id, "question": f.question, "answer": f.answer, "category": f.category, "sort_order": f.sort_order, "is_active": f.is_active}
            for f in rows
        ]
    return payload


def homepage_payload(session: Session) -> dict:
    cached = cache_get_json(CACHE_KEY)
    if cached is not None:
        return cached
    sections = session.exec(
        select(HomepageSection)
        .where(HomepageSection.is_enabled == True)  # noqa: E712
        .order_by(HomepageSection.sort_order)
    ).all()
    payload = {
        "sections": [_section_payload(session, s) for s in sections],
        "generated_at": datetime.now(UTC).isoformat(),
    }
    cache_set_json(CACHE_KEY, payload, ttl_seconds=60)
    return payload


def default_sections() -> list[HomepageSection]:
    """Sensible starter layout, used by the seed script and first boot."""
    return [
        HomepageSection(kind=HomepageSectionKind.hero, title="بنر اصلی", sort_order=0, limit_count=6),
        HomepageSection(kind=HomepageSectionKind.products, title="پرفروش‌ترین‌ها", source=ProductSource.best_sellers, sort_order=10, limit_count=8),
        HomepageSection(kind=HomepageSectionKind.categories, title="دسته‌بندی‌ها", sort_order=20, limit_count=8),
        HomepageSection(kind=HomepageSectionKind.products, title="تازه‌رسیده‌ها", source=ProductSource.new_arrivals, sort_order=30, limit_count=8),
        HomepageSection(kind=HomepageSectionKind.products, title="پیشنهاد ویژه", source=ProductSource.discounted, sort_order=40, limit_count=8),
        HomepageSection(kind=HomepageSectionKind.articles, title="از مجله تن‌سِرام", sort_order=50, limit_count=4),
        HomepageSection(kind=HomepageSectionKind.faq, title="سوالات رایج", sort_order=60, limit_count=5),
    ]
