from typing import TYPE_CHECKING, Optional

from sqlalchemy import DECIMAL, Column, Index
from sqlmodel import Field, Relationship

from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.product_image import ProductImage


class Product(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_slug", "slug", unique=True),
        Index("ix_products_sku", "sku", unique=True),
        Index("ix_products_category_id", "category_id"),
        Index("ix_products_is_active", "is_active"),
        Index("ix_products_price", "price"),
    )

    name: str = Field(index=True, max_length=255)
    slug: str = Field(max_length=255)
    category_id: str = Field(foreign_key="categories.id")
    description: str = Field(default="")
    short_description: str | None = Field(default=None, max_length=512)
    price: float = Field(sa_column=Column(DECIMAL(14, 0), nullable=False))
    compare_at_price: float | None = Field(
        default=None, sa_column=Column(DECIMAL(14, 0), nullable=True)
    )
    stock_qty: int = Field(default=0)
    sku: str = Field(max_length=64)
    weight_grams: int = Field(default=0)
    material: str | None = Field(default=None, max_length=255)
    dimensions: str | None = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)
    meta_title: str | None = Field(default=None, max_length=255)
    meta_description: str | None = Field(default=None, max_length=512)

    category: "Category" = Relationship(back_populates="products")
    images: list["ProductImage"] = Relationship(back_populates="product")

    @property
    def primary_image(self) -> Optional["ProductImage"]:
        for img in self.images:
            if img.is_primary:
                return img
        return self.images[0] if self.images else None

    @property
    def in_stock(self) -> bool:
        return self.stock_qty > 0

    @property
    def discount_percent(self) -> int:
        if not self.compare_at_price or self.compare_at_price <= self.price:
            return 0
        return round((1 - self.price / self.compare_at_price) * 100)
