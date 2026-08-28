from datetime import datetime

from sqlalchemy import Index
from sqlmodel import Field, Relationship

from app.models.base import TimestampMixin, UUIDMixin, utcnow


class Role(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "roles"
    name: str = Field(max_length=64, unique=True, index=True)


class User(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_email", "email", unique=True),)

    email: str = Field(max_length=255)
    password_hash: str = Field(max_length=255)
    full_name: str = Field(default="", max_length=255)
    phone: str | None = Field(default=None, max_length=20, index=True)
    is_active: bool = Field(default=True, index=True)
    is_admin: bool = Field(default=False, index=True)
    role_id: str | None = Field(default=None, foreign_key="roles.id")
    addresses: list["Address"] = Relationship(back_populates="user")


class Address(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "addresses"
    __table_args__ = (Index("ix_addresses_user_id", "user_id"),)

    user_id: str = Field(foreign_key="users.id")
    title: str = Field(default="", max_length=100)
    recipient_name: str = Field(max_length=255)
    phone: str = Field(max_length=20)
    address: str = Field(max_length=1024)
    city: str = Field(max_length=128)
    province: str = Field(max_length=128)
    postal_code: str = Field(max_length=16)
    is_default: bool = Field(default=False)
    user: User = Relationship(back_populates="addresses")


class RefreshToken(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "refresh_tokens"
    token_hash: str = Field(max_length=128, unique=True, index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    expires_at: datetime
    revoked_at: datetime | None = None


class PasswordResetToken(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "password_reset_tokens"
    token_hash: str = Field(max_length=128, unique=True, index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    expires_at: datetime
    used_at: datetime | None = None


class WishlistItem(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "wishlist_items"
    __table_args__ = (Index("uq_wishlist_user_product", "user_id", "product_id", unique=True),)
    user_id: str = Field(foreign_key="users.id")
    product_id: str = Field(foreign_key="products.id")
