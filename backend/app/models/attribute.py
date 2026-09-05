import enum
from sqlalchemy import Index
from sqlmodel import Field, Relationship

from app.models.base import TimestampMixin, UUIDMixin


class AttributeType(str, enum.Enum):
    color = "color"
    material = "material"
    size = "size"
    pattern = "pattern"
    capacity = "capacity"
    weight = "weight"
    origin = "origin"
    other = "other"


class Attribute(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "attributes"

    name: str = Field(max_length=64)
    slug: str = Field(max_length=64, unique=True, index=True)
    description: str | None = None
    attr_type: str = Field(default="other", max_length=32)
    is_filterable: bool = Field(default=False)
    sort_order: int = Field(default=0)

    values: list["AttributeValue"] = Relationship(back_populates="attribute")
    product_specs: list["ProductAttributeValue"] = Relationship(back_populates="attribute")


class AttributeValue(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "attribute_values"

    attribute_id: str = Field(foreign_key="attributes.id", index=True)
    value: str = Field(max_length=128)
    slug: str = Field(max_length=128, unique=True, index=True)
    swatch_image_url: str | None = Field(default=None, max_length=512)
    sort_order: int = Field(default=0)

    __table_args__ = (
        Index("ix_attribute_values_attribute_id_sort", "attribute_id", "sort_order"),
    )

    attribute: "Attribute" = Relationship(back_populates="values")
    product_specs: list["ProductAttributeValue"] = Relationship(back_populates="attribute_value")


class ProductAttributeValue(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "product_attribute_values"

    product_id: str = Field(foreign_key="products.id", index=True)
    attribute_id: str = Field(foreign_key="attributes.id", index=True)
    attribute_value_id: str = Field(foreign_key="attribute_values.id", index=True)
    custom_value: str | None = Field(default=None, max_length=255)
    sort_order: int = Field(default=0)

    __table_args__ = (
        Index("ix_pav_product_attr", "product_id", "attribute_id", unique=True),
    )

    product: "Product" = Relationship(back_populates="attribute_specs")
    attribute: "Attribute" = Relationship(back_populates="product_specs")
    attribute_value: "AttributeValue" = Relationship(back_populates="product_specs")
