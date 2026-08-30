"""cart_items for server-side cart

Revision ID: f3e4a9b8c7d6
Revises: daaaab5b4732
Create Date: 2026-08-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'f3e4a9b8c7d6'
down_revision: Union[str, None] = 'daaaab5b4732'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'cart_items',
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('user_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('product_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('variant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_cart_product_id', 'cart_items', ['product_id'], unique=False)
    op.create_index('ix_cart_user_id', 'cart_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_cart_items_product_id'), 'cart_items', ['product_id'], unique=False)
    op.create_index(op.f('ix_cart_items_user_id'), 'cart_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_cart_items_variant_id'), 'cart_items', ['variant_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_cart_items_variant_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_user_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_product_id'), table_name='cart_items')
    op.drop_index('ix_cart_user_id', table_name='cart_items')
    op.drop_index('ix_cart_product_id', table_name='cart_items')
    op.drop_table('cart_items')
