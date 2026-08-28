import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


class UUIDMixin(SQLModel):
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
    )


class TimestampMixin(SQLModel):
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore[call-arg]
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore[call-arg]
        nullable=False,
    )
