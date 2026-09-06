"""Remove dead feature tables: brands, campaigns, static pages, homepage sections, activity log, navigation, newsletter

Revision ID: h7i8j9k0l1m2
Revises: g4h5i6j7k8l9
Create Date: 2026-09-05

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'h7i8j9k0l1m2'
down_revision: Union[str, None] = 'g4h5i6j7k8l9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Dangling FK columns from removed features (order/product history stays intact)
    op.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_campaign_id_fkey")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS campaign_id")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS campaign_discount_amount")
    op.execute("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_brand_id_fkey")
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS brand_id")

    # Dead feature tables (order matters only for FKs; CASCADE handles leftovers)
    op.execute("DROP TABLE IF EXISTS homepage_sections CASCADE")
    op.execute("DROP TABLE IF EXISTS navigation_menus CASCADE")
    op.execute("DROP TABLE IF EXISTS activity_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS newsletter_subscriptions CASCADE")
    op.execute("DROP TABLE IF EXISTS static_pages CASCADE")
    op.execute("DROP TABLE IF EXISTS campaigns CASCADE")
    op.execute("DROP TABLE IF EXISTS brands CASCADE")


def downgrade() -> None:
    # No down-path: removed features are not coming back.
    pass
