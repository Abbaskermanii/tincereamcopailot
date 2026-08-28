"""CMS, operations and wishlist relations."""
from alembic import op
import sqlalchemy as sa
revision="9b2c_content_ops"; down_revision="8a1c_identity_ops"; branch_labels=None; depends_on=None
def ts(): return [sa.Column("created_at",sa.DateTime(timezone=True),nullable=False),sa.Column("updated_at",sa.DateTime(timezone=True),nullable=False)]
def base(name, cols, indexes=()):
    op.create_table(name,*ts(),sa.Column("id",sa.String(36),primary_key=True),*cols)
    for n,c in indexes: op.create_index(n,name,[c])
def upgrade():
    base("related_products",[sa.Column("product_id",sa.String(36),sa.ForeignKey("products.id"),nullable=False),sa.Column("related_product_id",sa.String(36),sa.ForeignKey("products.id"),nullable=False)],(("ix_related_products_product_id","product_id"),("ix_related_products_related_product_id","related_product_id")))
    base("article_categories",[sa.Column("name",sa.String(255),nullable=False),sa.Column("slug",sa.String(255),unique=True,nullable=False)])
    base("articles",[sa.Column("title",sa.String(255),nullable=False),sa.Column("slug",sa.String(255),unique=True,nullable=False),sa.Column("body",sa.Text(),nullable=False),sa.Column("excerpt",sa.Text(),nullable=False),sa.Column("category_id",sa.String(36),sa.ForeignKey("article_categories.id")),sa.Column("author_id",sa.String(36),sa.ForeignKey("users.id")),sa.Column("is_published",sa.Boolean(),server_default=sa.false()),sa.Column("published_at",sa.DateTime(timezone=True)),sa.Column("meta_title",sa.String(255)),sa.Column("meta_description",sa.String(512))])
    for name, cols in {"carousels":[("title",sa.String(255)),("image_url",sa.String(1024)),("link_url",sa.String(1024)),("sort_order",sa.Integer()),("is_active",sa.Boolean()),("starts_at",sa.DateTime(timezone=True)),("ends_at",sa.DateTime(timezone=True))],"settings":[("key",sa.String(128)),("value",sa.Text()),("value_type",sa.String(32))],"activity_logs":[("actor_id",sa.String(36)),("action",sa.String(128)),("entity_type",sa.String(64)),("entity_id",sa.String(36)),("metadata_json",sa.Text())],"newsletter_subscriptions":[("email",sa.String(255)),("consent",sa.Boolean()),("unsubscribed_at",sa.DateTime(timezone=True))]}.items():
        base(name,[sa.Column(c,t,nullable=False if c in ("title","image_url","key","email","action","entity_type") else True) for c,t in cols])
    base("notifications",[sa.Column("user_id",sa.String(36),sa.ForeignKey("users.id"),nullable=False),sa.Column("title",sa.String(255),nullable=False),sa.Column("body",sa.Text(),nullable=False),sa.Column("is_read",sa.Boolean(),server_default=sa.false())])
def downgrade():
    for n in ("notifications","newsletter_subscriptions","activity_logs","settings","carousels","articles","article_categories","related_products"): op.drop_table(n)
