"""attributes + variant mapping + image tagging

Revision ID: 0a8ab2ffdac5
Revises: 71591faa38b8
Create Date: 2026-08-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = '0a8ab2ffdac5'
down_revision: Union[str, None] = '71591faa38b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Attributes
    op.create_table('attributes',
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=128), nullable=False),
        sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(length=128), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_attributes_name', 'attributes', ['name'], unique=False)
    op.create_index('ix_attributes_slug', 'attributes', ['slug'], unique=True)

    op.create_table('attribute_values',
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('attribute_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('value', sqlmodel.sql.sqltypes.AutoString(length=128), nullable=False),
        sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(length=128), nullable=False),
        sa.Column('swatch_image_url', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['attribute_id'], ['attributes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_attr_values_attribute_id', 'attribute_values', ['attribute_id'], unique=False)
    op.create_index(op.f('ix_attribute_values_slug'), 'attribute_values', ['slug'], unique=False)
    op.create_index('uq_attr_values_attr_slug', 'attribute_values', ['attribute_id', 'slug'], unique=True)

    op.create_table('product_attributes',
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('product_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('attribute_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['attribute_id'], ['attributes.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_product_attributes_product_id', 'product_attributes', ['product_id'], unique=False)
    op.create_index(op.f('ix_product_attributes_attribute_id'), 'product_attributes', ['attribute_id'], unique=False)
    op.create_index('uq_product_attribute', 'product_attributes', ['product_id', 'attribute_id'], unique=True)

    op.create_table('product_variant_attribute_values',
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('variant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('attribute_value_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.ForeignKeyConstraint(['attribute_value_id'], ['attribute_values.id'], ),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pvav_variant_id', 'product_variant_attribute_values', ['variant_id'], unique=False)
    op.create_index('ix_pvav_attribute_value_id', 'product_variant_attribute_values', ['attribute_value_id'], unique=False)
    op.create_index('uq_pvav_variant_value', 'product_variant_attribute_values', ['variant_id', 'attribute_value_id'], unique=True)

    # add attribute_value_id to product_images
    op.add_column('product_images', sa.Column('attribute_value_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.create_index(op.f('ix_product_images_attribute_value_id'), 'product_images', ['attribute_value_id'], unique=False)
    op.create_foreign_key(None, 'product_images', 'attribute_values', ['attribute_value_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint(None, 'product_images', type_='foreignkey')
    op.drop_index(op.f('ix_product_images_attribute_value_id'), table_name='product_images')
    op.drop_column('product_images', 'attribute_value_id')
    op.drop_table('product_variant_attribute_values')
    op.drop_table('product_attributes')
    op.drop_table('attribute_values')
    op.drop_table('attributes')
