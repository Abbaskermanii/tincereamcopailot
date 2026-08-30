from typing import TYPE_CHECKING

from sqlalchemy import Index
from sqlmodel import Field, Relationship

from app.models.base import UUIDMixin

if TYPE_CHECKING:
    from app.models.product import Product


class ProductImage(UUIDMixin, table=True):
    __tablename__ = "product_images"
    __table_args__ = (Index("ix_product_images_product_id", "product_id"),)

    product_id: str = Field(foreign_key="products.id")
    url: str = Field(max_length=512)
    alt_text: str = Field(default="", max_length=512)
    sort_order: int = Field(default=0)
    is_primary: bool = Field(default=False)
    attribute_value_id: str | None = Field(default=None, foreign_key="attribute_values.id", index=True)

    product: "Product" = Relationship(back_populates="images")
