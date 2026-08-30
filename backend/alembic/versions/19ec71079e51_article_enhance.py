"""article enhance: view_count, featured, reading_time, tags

Revision ID: 19ec71079e51
Revises: 0a8ab2ffdac5
Create Date: 2026-08-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = '19ec71079e51'
down_revision: Union[str, None] = '0a8ab2ffdac5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # add columns to articles
    op.add_column('articles', sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'))
    op.create_index(op.f('ix_articles_view_count'), 'articles', ['view_count'], unique=False)
    op.add_column('articles', sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'))
    op.create_index(op.f('ix_articles_is_featured'), 'articles', ['is_featured'], unique=False)
    op.add_column('articles', sa.Column('reading_time_minutes', sa.Integer(), nullable=False, server_default='0'))

    # article_tags
    op.create_table('article_tags',
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_article_tags_name'), 'article_tags', ['name'], unique=False)
    op.create_index(op.f('ix_article_tags_slug'), 'article_tags', ['slug'], unique=True)

    op.create_table('article_tag_links',
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('article_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('tag_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.ForeignKeyConstraint(['article_id'], ['articles.id'], ),
        sa.ForeignKeyConstraint(['tag_id'], ['article_tags.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_article_tag_links_article_id'), 'article_tag_links', ['article_id'], unique=False)
    op.create_index(op.f('ix_article_tag_links_tag_id'), 'article_tag_links', ['tag_id'], unique=False)
    op.create_index('uq_article_tag', 'article_tag_links', ['article_id', 'tag_id'], unique=True)


def downgrade() -> None:
    op.drop_table('article_tag_links')
    op.drop_table('article_tags')
    op.drop_column('articles', 'reading_time_minutes')
    op.drop_index(op.f('ix_articles_is_featured'), table_name='articles')
    op.drop_column('articles', 'is_featured')
    op.drop_index(op.f('ix_articles_view_count'), table_name='articles')
    op.drop_column('articles', 'view_count')
