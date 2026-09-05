"""add product_attribute_values, loyalty fields, navigation settings

Revision ID: g4h5i6j7k8l9
Revises: f1e2d3c4b5a6
Create Date: 2026-09-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = 'g4h5i6j7k8l9'
down_revision: Union[str, None] = 'f1e2d3c4b5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create product_attribute_values table
    op.create_table(
        'product_attribute_values',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('product_id', sa.String(36), sa.ForeignKey('products.id'), nullable=False, index=True),
        sa.Column('attribute_id', sa.String(36), sa.ForeignKey('attributes.id'), nullable=False, index=True),
        sa.Column('attribute_value_id', sa.String(36), sa.ForeignKey('attribute_values.id'), nullable=False, index=True),
        sa.Column('custom_value', sa.String(255), nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_pav_product_attr', 'product_attribute_values', ['product_id', 'attribute_id'], unique=True)

    # Add loyalty fields to users
    op.add_column('users', sa.Column('loyalty_points', sa.Integer(), server_default='0'))
    op.add_column('users', sa.Column('loyalty_tier', sa.String(16), server_default='bronze'))


def downgrade() -> None:
    op.drop_column('users', 'loyalty_tier')
    op.drop_column('users', 'loyalty_points')
    op.drop_index('ix_pav_product_attr', table_name='product_attribute_values')
    op.drop_table('product_attribute_values')
