"""homepage sections + article covers + product view_count

Revision ID: b7c9d1e2f4a6
Revises: a1b2c3d4e5f6
Create Date: 2026-08-30 04:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'b7c9d1e2f4a6'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('homepage_sections',
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('kind', sa.Enum('hero', 'products', 'categories', 'articles', 'faq', 'newsletter', name='homepagesectionkind'), nullable=True),
    sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
    sa.Column('subtitle', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
    sa.Column('is_enabled', sa.Boolean(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('limit_count', sa.Integer(), nullable=False),
    sa.Column('source', sa.Enum('best_sellers', 'popular', 'new_arrivals', 'discounted', 'category', 'manual', name='productsource'), nullable=True),
    sa.Column('category_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('product_ids', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_homepage_sections_enabled_sort', 'homepage_sections', ['is_enabled', 'sort_order'], unique=False)
    op.create_index(op.f('ix_homepage_sections_kind'), 'homepage_sections', ['kind'], unique=False)
    op.create_index(op.f('ix_homepage_sections_source'), 'homepage_sections', ['source'], unique=False)

    op.add_column('articles', sa.Column('cover_url', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True))
    op.add_column('products', sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'))
    op.create_index(op.f('ix_products_view_count'), 'products', ['view_count'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_products_view_count'), table_name='products')
    op.drop_column('products', 'view_count')
    op.drop_column('articles', 'cover_url')
    op.drop_index('ix_homepage_sections_enabled_sort', table_name='homepage_sections')
    op.drop_index(op.f('ix_homepage_sections_source'), table_name='homepage_sections')
    op.drop_index(op.f('ix_homepage_sections_kind'), table_name='homepage_sections')
    op.drop_table('homepage_sections')
    sa.Enum(name='productsource').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='homepagesectionkind').drop(op.get_bind(), checkfirst=True)
