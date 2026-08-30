from datetime import datetime

from sqlalchemy import Column, DateTime, Index, UniqueConstraint
from sqlmodel import Field

from app.models.base import TimestampMixin, UUIDMixin, utcnow


class ProductReview(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "product_reviews"
    __table_args__ = (
        Index("ix_reviews_product_id", "product_id"),
        Index("ix_reviews_approved", "is_approved"),
        UniqueConstraint("product_id", "user_id", name="uq_review_user_product"),
    )

    product_id: str = Field(foreign_key="products.id", index=True)
    user_id: str | None = Field(default=None, foreign_key="users.id", index=True)
    author_name: str = Field(max_length=128)
    rating: int = Field(default=5, ge=1, le=5)
    title: str = Field(default="", max_length=255)
    body: str = ""
    is_approved: bool = Field(default=False, index=True)
    is_buyer: bool = Field(default=False)
    helpful_count: int = Field(default=0)
    admin_reply: str | None = None
    replied_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))


class ReviewFeedback(UUIDMixin, table=True):
    """One "helpful" vote per user per review."""

    __tablename__ = "review_feedbacks"
    __table_args__ = (UniqueConstraint("review_id", "user_id", name="uq_feedback_user_review"),)

    review_id: str = Field(foreign_key="product_reviews.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)


class ProductQuestion(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "product_questions"
    __table_args__ = (Index("ix_questions_product_id", "product_id"),)

    product_id: str = Field(foreign_key="products.id", index=True)
    user_id: str | None = Field(default=None, foreign_key="users.id")
    author_name: str = Field(max_length=128)
    question: str = Field(max_length=1024)
    answer: str | None = None
    is_published: bool = Field(default=False, index=True)
    answered_by: str | None = Field(default=None, foreign_key="users.id")


class StockNotifyRequest(UUIDMixin, TimestampMixin, table=True):
    """"Tell me when back in stock" — one row per contact per product."""

    __tablename__ = "stock_notify_requests"
    __table_args__ = (
        Index("ix_stock_notify_product", "product_id"),
        UniqueConstraint("product_id", "contact", name="uq_stock_notify_contact"),
    )

    product_id: str = Field(foreign_key="products.id")
    contact: str = Field(max_length=255)  # email or phone
    notified_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))
