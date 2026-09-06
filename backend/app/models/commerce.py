from datetime import datetime

from sqlalchemy import DECIMAL, Column, DateTime, Enum, Index
from sqlmodel import Field

from app.models.base import TimestampMixin, UUIDMixin, utcnow
from app.models.coupon import DiscountType

class PaymentTransaction(UUIDMixin, TimestampMixin, table=True):
    """Audit ledger for every gateway interaction (request + verify)."""

    __tablename__ = "payment_transactions"
    __table_args__ = (Index("ix_txn_order_id", "order_id"), Index("ix_txn_authority", "authority"))

    order_id: str = Field(foreign_key="orders.id", index=True)
    gateway: str = Field(default="zarinpal", max_length=32)
    authority: str = Field(default="", max_length=128)
    ref_id: str | None = Field(default=None, max_length=128)
    amount_toman: float = Field(default=0, sa_column=Column(DECIMAL(14, 0), nullable=False, default=0))
    status: str = Field(default="initiated", max_length=32, index=True)  # initiated|verified|failed|cancelled
    message: str | None = None
    raw_payload: str | None = None

class ShippingMethod(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "shipping_methods"

    name: str = Field(max_length=128)
    code: str = Field(max_length=64, unique=True, index=True)
    cost: float = Field(default=0, sa_column=Column(DECIMAL(14, 0), nullable=False, default=0))
    free_over_amount: float | None = Field(default=None, sa_column=Column(DECIMAL(14, 0), nullable=True))
    estimated_days_min: int = Field(default=2)
    estimated_days_max: int = Field(default=5)
    is_active: bool = Field(default=True, index=True)
    sort_order: int = Field(default=0)

class ReturnRequest(UUIDMixin, TimestampMixin, table=True):
    """Customer return/refund request (RMA)."""

    __tablename__ = "return_requests"
    __table_args__ = (Index("ix_returns_order_id", "order_id"),)

    order_id: str = Field(foreign_key="orders.id", index=True)
    user_id: str | None = Field(default=None, foreign_key="users.id")
    reason: str = Field(max_length=1024)
    status: str = Field(default="requested", max_length=32, index=True)  # requested|approved|rejected|received|refunded
    admin_note: str | None = None
    refund_amount: float = Field(default=0, sa_column=Column(DECIMAL(14, 0), nullable=False, default=0))
    resolved_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))

class OrderStatusHistory(UUIDMixin, table=True):
    __tablename__ = "order_status_history"
    __table_args__ = (Index("ix_osh_order_id", "order_id"),)

    order_id: str = Field(foreign_key="orders.id", index=True)
    from_status: str | None = Field(default=None, max_length=32)
    to_status: str = Field(max_length=32)
    note: str | None = None
    actor_id: str | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

class CouponRedemption(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "coupon_redemptions"
    __table_args__ = (
        Index("ix_redemptions_coupon_id", "coupon_id"),
        Index("uq_redemption_coupon_user_order", "coupon_id", "user_id", "order_id"),
    )

    coupon_id: str = Field(foreign_key="coupons.id", index=True)
    user_id: str | None = Field(default=None, foreign_key="users.id", index=True)
    order_id: str = Field(foreign_key="orders.id")
    discount_amount: float = Field(default=0, sa_column=Column(DECIMAL(14, 0), nullable=False, default=0))

class CartItem(UUIDMixin, TimestampMixin, table=True):
    """Persistent cart for authenticated users (cross-device, server-authoritative)."""

    __tablename__ = "cart_items"
    __table_args__ = (Index("ix_cart_user_id", "user_id"), Index("ix_cart_product_id", "product_id"))

    user_id: str = Field(foreign_key="users.id", index=True)
    product_id: str = Field(foreign_key="products.id", index=True)
    variant_id: str | None = Field(default=None, foreign_key="product_variants.id", index=True)
    quantity: int = Field(default=1, ge=1, le=99)
