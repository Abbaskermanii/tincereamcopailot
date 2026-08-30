from sqlalchemy import Index
from sqlmodel import Field

from app.models.base import TimestampMixin, UUIDMixin


class Attribute(UUIDMixin, TimestampMixin, table=True):
    """Global attribute definition e.g. 'رنگ' or 'طرح' — reusable across products."""

    __tablename__ = "attributes"
    __table_args__ = (
        Index("ix_attributes_slug", "slug", unique=True),
    )

    name: str = Field(max_length=128, index=True)
    slug: str = Field(max_length=128, unique=True, index=True)
    sort_order: int = Field(default=0)


class AttributeValue(UUIDMixin, TimestampMixin, table=True):
    """Concrete value for an attribute, e.g. 'خرسی' for attribute 'طرح'."""

    __tablename__ = "attribute_values"
    __table_args__ = (
        Index("ix_attr_values_attribute_id", "attribute_id"),
        Index("uq_attr_values_attr_slug", "attribute_id", "slug", unique=True),
    )

    attribute_id: str = Field(foreign_key="attributes.id", index=True)
    value: str = Field(max_length=128)
    slug: str = Field(max_length=128, index=True)
    swatch_image_url: str | None = Field(default=None, max_length=512)
    sort_order: int = Field(default=0)


class ProductAttribute(UUIDMixin, TimestampMixin, table=True):
    """Which attributes a product has."""

    __tablename__ = "product_attributes"
    __table_args__ = (
        Index("uq_product_attribute", "product_id", "attribute_id", unique=True),
        Index("ix_product_attributes_product_id", "product_id"),
    )

    product_id: str = Field(foreign_key="products.id", index=True)
    attribute_id: str = Field(foreign_key="attributes.id", index=True)
    sort_order: int = Field(default=0)


class ProductVariantAttributeValue(UUIDMixin, table=True):
    """Link variant to its attribute values (one per attribute dimension)."""

    __tablename__ = "product_variant_attribute_values"
    __table_args__ = (
        Index("ix_pvav_variant_id", "variant_id"),
        Index("ix_pvav_attribute_value_id", "attribute_value_id"),
        Index("uq_pvav_variant_value", "variant_id", "attribute_value_id", unique=True),
    )

    variant_id: str = Field(foreign_key="product_variants.id")
    attribute_value_id: str = Field(foreign_key="attribute_values.id")
