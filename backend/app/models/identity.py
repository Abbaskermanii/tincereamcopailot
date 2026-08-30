import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Index
from sqlmodel import Field, Relationship

from app.models.base import TimestampMixin, UUIDMixin


class OtpPurpose(str, enum.Enum):
    login = "login"
    register = "register"
    reset = "reset"


class OtpCode(UUIDMixin, TimestampMixin, table=True):
    """One-time SMS/email code. Stores only a SHA-256 hash of the code."""

    __tablename__ = "otp_codes"
    __table_args__ = (Index("ix_otp_destination", "destination"),)

    destination: str = Field(max_length=255, index=True)  # phone or email (lowercased)
    purpose: OtpPurpose = Field(sa_column=Column(Enum(OtpPurpose, name="otppurpose", native_enum=False)))
    code_hash: str = Field(max_length=128)
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    used_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))
    attempts: int = Field(default=0)
    created_ip: str | None = Field(default=None, max_length=64)


class Role(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "roles"
    name: str = Field(max_length=64, unique=True, index=True)
    # comma-separated permission keys; "*" = superadmin
    permissions: str = Field(default="", max_length=2048)


class User(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_email", "email", unique=True),)

    email: str = Field(max_length=255)
    password_hash: str = Field(default="", max_length=255)
    full_name: str = Field(default="", max_length=255)
    phone: str | None = Field(default=None, max_length=20, index=True)
    avatar_url: str | None = Field(default=None, max_length=512)
    is_active: bool = Field(default=True, index=True)
    is_admin: bool = Field(default=False, index=True)
    role_id: str | None = Field(default=None, foreign_key="roles.id")
    failed_login_attempts: int = Field(default=0)
    locked_until: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))
    last_login_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))
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
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    revoked_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))


class PasswordResetToken(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "password_reset_tokens"
    token_hash: str = Field(max_length=128, unique=True, index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    used_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))


class WishlistItem(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "wishlist_items"
    __table_args__ = (Index("uq_wishlist_user_product", "user_id", "product_id", unique=True),)
    user_id: str = Field(foreign_key="users.id")
    product_id: str = Field(foreign_key="products.id")
