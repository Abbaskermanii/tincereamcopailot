import enum
from datetime import datetime

from sqlalchemy import DECIMAL, Column, DateTime, Enum, Index
from sqlmodel import Field

from app.models.base import UUIDMixin


class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"


class Coupon(UUIDMixin, table=True):
    __tablename__ = "coupons"
    __table_args__ = (Index("ix_coupons_code", "code", unique=True),)

    code: str = Field(max_length=64)
    discount_type: DiscountType = Field(sa_column=Column(Enum(DiscountType, name="discounttype")))
    discount_value: float = Field(sa_column=Column(DECIMAL(14, 0), nullable=False))
    min_order_amount: float = Field(
        default=0, sa_column=Column(DECIMAL(14, 0), nullable=False, default=0)
    )
    expires_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    usage_limit: int = Field(default=0)  # 0 = unlimited
    used_count: int = Field(default=0)

    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        from app.models.base import utcnow

        return self.expires_at <= utcnow()

    @property
    def is_exhausted(self) -> bool:
        return self.usage_limit > 0 and self.used_count >= self.usage_limit

    def is_valid(self, order_total: float) -> tuple[bool, str]:
        if self.is_expired:
            return False, "این کد تخفیف منقضی شده است."
        if self.is_exhausted:
            return False, "ظرفیت استفاده از این کد تخفیف به پایان رسیده است."
        if order_total < self.min_order_amount:
            return False, "مبلغ سفارش برای استفاده از این کد کافی نیست."
        return True, ""

    def compute_discount(self, order_total: float) -> float:
        value = float(self.discount_value)
        if self.discount_type == DiscountType.percentage:
            result = order_total * (value / 100)
        else:
            result = value
        # never discount more than the total
        return min(round(result), round(order_total))
