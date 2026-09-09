import enum
from typing import TYPE_CHECKING

from sqlalchemy import Column, Enum, Index
from sqlmodel import Field, Relationship

from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.order_item import OrderItem


class OrderStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class Order(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "orders"
    __table_args__ = (Index("ix_orders_status", "status"),)

    order_number: str = Field(unique=True, max_length=32)
    customer_name: str = Field(max_length=255)
    phone: str = Field(max_length=20)
    email: str | None = Field(default=None, max_length=255)
    address: str = Field(max_length=1024)
    city: str = Field(max_length=128)
    province: str = Field(max_length=128)
    postal_code: str = Field(max_length=16)
    total_amount: float = 0
    shipping_cost: float = 0
    discount_amount: float = 0
    tax_rate: float = 0  # e.g. 0.09 for 9% VAT
    tax_amount: float = 0
    coupon_code: str | None = Field(default=None, max_length=64)
    gift_wrap: bool = False
    gift_note: str | None = Field(default=None, max_length=512)
    status: OrderStatus = Field(
        default=OrderStatus.pending,
        sa_column=Column(
            Enum(OrderStatus, name="orderstatus", native_enum=False),
            nullable=False,
            default=OrderStatus.pending,
        ),
    )
    payment_authority: str | None = Field(default=None, max_length=128)
    payment_ref_id: str | None = Field(default=None, max_length=128)
    user_id: str | None = Field(default=None, foreign_key="users.id", index=True)
    address_id: str | None = Field(default=None, foreign_key="addresses.id", index=True)
    shipping_method_id: str | None = Field(default=None, foreign_key="shipping_methods.id")
    shipping_method_name: str | None = Field(default=None, max_length=128)
    tracking_code: str | None = Field(default=None, max_length=64, index=True)
    carrier: str | None = Field(default=None, max_length=64)
    admin_note: str | None = Field(default=None, max_length=1024)

    items: list["OrderItem"] = Relationship(back_populates="order")
