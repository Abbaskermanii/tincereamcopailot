"""identity, wishlist and operational primitives."""
from alembic import op
import sqlalchemy as sa

revision = "8a1c_identity_ops"
down_revision = "46d102f45e40"
branch_labels = None
depends_on = None


def _timestamps():
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    ]


def upgrade():
    op.create_table("roles", *_timestamps(), sa.Column("id", sa.String(36), primary_key=True), sa.Column("name", sa.String(64), unique=True, nullable=False))
    op.create_table("users", *_timestamps(), sa.Column("id", sa.String(36), primary_key=True), sa.Column("email", sa.String(255), nullable=False, unique=True), sa.Column("password_hash", sa.String(255), nullable=False), sa.Column("full_name", sa.String(255), nullable=False, server_default=""), sa.Column("phone", sa.String(20)), sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()), sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()), sa.Column("role_id", sa.String(36), sa.ForeignKey("roles.id")))
    op.add_column("orders", sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True))
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_phone", "users", ["phone"])
    op.create_table("addresses", *_timestamps(), sa.Column("id", sa.String(36), primary_key=True), sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("title", sa.String(100), nullable=False, server_default=""), sa.Column("recipient_name", sa.String(255), nullable=False), sa.Column("phone", sa.String(20), nullable=False), sa.Column("address", sa.String(1024), nullable=False), sa.Column("city", sa.String(128), nullable=False), sa.Column("province", sa.String(128), nullable=False), sa.Column("postal_code", sa.String(16), nullable=False), sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_addresses_user_id", "addresses", ["user_id"])
    for name, user_fk in (("refresh_tokens", True), ("password_reset_tokens", True)):
        cols = [sa.Column("id", sa.String(36), primary_key=True), sa.Column("token_hash", sa.String(128), nullable=False, unique=True), sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False)]
        if name == "refresh_tokens":
            cols.append(sa.Column("revoked_at", sa.DateTime(timezone=True)))
        else:
            cols.append(sa.Column("used_at", sa.DateTime(timezone=True)))
        op.create_table(name, *_timestamps(), *cols)
        op.create_index("ix_%s_token_hash" % name, name, ["token_hash"], unique=True)
        op.create_index("ix_%s_user_id" % name, name, ["user_id"])
    op.create_table("wishlist_items", *_timestamps(), sa.Column("id", sa.String(36), primary_key=True), sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("product_id", sa.String(36), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False), sa.UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"))


def downgrade():
    op.drop_index("ix_orders_user_id", table_name="orders")
    op.drop_column("orders", "user_id")
    for name in ("wishlist_items", "password_reset_tokens", "refresh_tokens", "addresses", "users", "roles"):
        op.drop_table(name)
