from sqlalchemy import DECIMAL, Column, Index
from sqlmodel import Field, Relationship

from app.models.base import TimestampMixin, UUIDMixin


class ProductVariant(UUIDMixin, TimestampMixin, table=True):
    """A sellable option of a product (size/color/…). Price is a delta or absolute:

    * ``price_delta = 0`` → inherits the product price.
    * ``price_delta > 0`` → product price + delta.
    * ``absolute_price`` set → wins over both.
    """

    __tablename__ = "product_variants"
    __table_args__ = (
        Index("ix_variants_product_id", "product_id"),
        Index("uq_variants_product_sku", "product_id", "sku", unique=True),
    )

    product_id: str = Field(foreign_key="products.id")
    name: str = Field(max_length=128)  # e.g. "رنگ: فیروزه‌ای"
    sku: str = Field(max_length=64)
    image_url: str | None = Field(default=None, max_length=512)  # product variant image
    price_delta: float = Field(default=0, sa_column=Column(DECIMAL(14, 0), nullable=False, default=0))
    absolute_price: float | None = Field(default=None, sa_column=Column(DECIMAL(14, 0), nullable=True))
    stock_qty: int = Field(default=0)
    sort_order: int = Field(default=0)
    is_active: bool = Field(default=True, index=True)

    @property
    def effective_price(self, base_price: float = 0) -> float:
        if self.absolute_price:
            return float(self.absolute_price)
        return base_price + float(self.price_delta)
