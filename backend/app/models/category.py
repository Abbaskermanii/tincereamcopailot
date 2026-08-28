from typing import TYPE_CHECKING, Optional

from sqlalchemy import Index, UniqueConstraint
from sqlmodel import Field, Relationship

from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.product import Product


class Category(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_category_slug"),
        Index("ix_categories_slug", "slug"),
        Index("ix_categories_parent_id", "parent_id"),
    )

    name: str = Field(index=True, max_length=255)
    slug: str = Field(max_length=255)
    image_url: str | None = Field(default=None, max_length=512)
    description: str | None = Field(default=None)
    parent_id: str | None = Field(default=None, foreign_key="categories.id")

    parent: Optional["Category"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Category.id"},
    )
    children: list["Category"] = Relationship(back_populates="parent")
    products: list["Product"] = Relationship(back_populates="category")
