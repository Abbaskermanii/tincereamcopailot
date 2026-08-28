from typing import TYPE_CHECKING

from sqlalchemy import DECIMAL, Column, Index
from sqlmodel import Field, Relationship

from app.models.base import UUIDMixin

if TYPE_CHECKING:
    from app.models.order import Order


class OrderItem(UUIDMixin, table=True):
    __tablename__ = "order_items"
    __table_args__ = (Index("ix_order_items_order_id", "order_id"),)

    order_id: str = Field(foreign_key="orders.id")
    product_id: str = Field(foreign_key="products.id")
    product_name_snapshot: str = Field(max_length=255)
    unit_price_snapshot: float = Field(sa_column=Column(DECIMAL(14, 0), nullable=False))
    quantity: int = Field(gt=0)
    subtotal: float = Field(sa_column=Column(DECIMAL(14, 0), nullable=False))

    order: "Order" = Relationship(back_populates="items")
