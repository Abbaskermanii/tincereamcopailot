from datetime import datetime
from sqlmodel import Field
from app.models.base import UUIDMixin, TimestampMixin

class RelatedProduct(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "related_products"
    product_id: str = Field(foreign_key="products.id", index=True)
    related_product_id: str = Field(foreign_key="products.id", index=True)

class ArticleCategory(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "article_categories"
    name: str = Field(max_length=255)
    slug: str = Field(max_length=255, unique=True, index=True)

class Article(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "articles"
    title: str = Field(max_length=255)
    slug: str = Field(max_length=255, unique=True, index=True)
    body: str = ""
    excerpt: str = ""
    cover_url: str | None = Field(default=None, max_length=512)
    category_id: str | None = Field(default=None, foreign_key="article_categories.id")
    author_id: str | None = Field(default=None, foreign_key="users.id")
    is_published: bool = Field(default=False, index=True)
    published_at: datetime | None = None
    meta_title: str | None = None
    meta_description: str | None = None

class Carousel(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "carousels"
    title: str = Field(max_length=255)
    subtitle: str | None = Field(default=None, max_length=512)
    image_url: str = Field(max_length=1024)
    link_url: str | None = None
    sort_order: int = 0
    is_active: bool = True
    starts_at: datetime | None = None
    ends_at: datetime | None = None

class Setting(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "settings"
    key: str = Field(max_length=128, unique=True, index=True)
    value: str = ""
    value_type: str = "string"

class Notification(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "notifications"
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str
    body: str = ""
    is_read: bool = Field(default=False, index=True)

class ActivityLog(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "activity_logs"
    actor_id: str | None = Field(default=None, index=True)
    action: str = Field(max_length=128, index=True)
    entity_type: str = Field(max_length=64)
    entity_id: str | None = None
    metadata_json: str = "{}"

class NewsletterSubscription(UUIDMixin, TimestampMixin, table=True):
    __tablename__ = "newsletter_subscriptions"
    email: str = Field(max_length=255, unique=True, index=True)
    consent: bool = True
    unsubscribed_at: datetime | None = None
