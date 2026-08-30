from sqlmodel import Field

from app.models.base import TimestampMixin, UUIDMixin


class Brand(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "brands"

    name: str = Field(index=True, max_length=255)
    slug: str = Field(max_length=255, unique=True, index=True)
    logo_url: str | None = Field(default=None, max_length=512)
    description: str | None = None
    is_active: bool = Field(default=True, index=True)
