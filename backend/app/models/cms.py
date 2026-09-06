from datetime import datetime

from sqlalchemy import Column, DateTime, Index
from sqlmodel import Field

from app.models.base import TimestampMixin, UUIDMixin, utcnow

class FAQItem(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "faq_items"
    __table_args__ = (Index("ix_faq_sort", "sort_order"),)

    question: str = Field(max_length=512)
    answer: str
    category: str = Field(default="عمومی", max_length=64, index=True)
    sort_order: int = Field(default=0)
    is_active: bool = Field(default=True, index=True)

class ContactMessage(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "contact_messages"

    name: str = Field(max_length=128)
    email: str = Field(default="", max_length=255)
    phone: str = Field(default="", max_length=20)
    subject: str = Field(default="", max_length=255)
    message: str
    is_read: bool = Field(default=False, index=True)
    replied_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))
    reply: str | None = None
