"""DB-driven homepage composition: the storefront homepage renders whatever
sections the admin enables here, in the admin-defined order."""

import enum
import json

from sqlalchemy import Index
from sqlmodel import Field

from app.models.base import TimestampMixin, UUIDMixin


class HomepageSectionKind(str, enum.Enum):
    hero = "hero"              # hero carousel (slides come from the Carousel table)
    products = "products"      # product slider — source decides which products
    categories = "categories"  # category cards grid
    articles = "articles"      # latest article teasers
    faq = "faq"                # FAQ accordion
    newsletter = "newsletter"  # newsletter signup band


class ProductSource(str, enum.Enum):
    """Which products a `products` section shows."""

    best_sellers = "best_sellers"
    popular = "popular"
    new_arrivals = "new_arrivals"
    discounted = "discounted"
    category = "category"
    manual = "manual"


class HomepageSection(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "homepage_sections"
    __table_args__ = (
        Index("ix_homepage_sections_enabled_sort", "is_enabled", "sort_order"),
    )

    kind: HomepageSectionKind = Field(index=True)
    title: str = Field(default="", max_length=255)
    subtitle: str | None = Field(default=None, max_length=512)
    is_enabled: bool = Field(default=True, index=True)
    sort_order: int = Field(default=0)
    limit_count: int = Field(default=8, ge=1, le=24)
    # products-section only:
    source: ProductSource | None = Field(default=None, index=True)
    category_id: str | None = Field(default=None, foreign_key="categories.id")
    product_ids: str = "[]"  # JSON list for source=manual

    def manual_ids(self) -> list[str]:
        try:
            return [i for i in json.loads(self.product_ids or "[]") if isinstance(i, str)]
        except Exception:
            return []
