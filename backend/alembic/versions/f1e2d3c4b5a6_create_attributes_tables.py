"""create attributes and attribute_values tables

Revision ID: f1e2d3c4b5a6
Revises: e6f7a8b9c0d4
Create Date: 2026-09-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = 'f1e2d3c4b5a6'
down_revision: Union[str, None] = 'e6f7a8b9c0d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'attributes',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('name', sa.String(64), nullable=False),
        sa.Column('slug', sa.String(64), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('attr_type', sa.String(32), server_default='other'),
        sa.Column('is_filterable', sa.Boolean(), server_default='false'),
        sa.Column('sort_order', sa.Integer(), server_default='0'),
    )
    op.create_index('ix_attributes_slug', 'attributes', ['slug'], unique=True)

    op.create_table(
        'attribute_values',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('attribute_id', sa.String(36), sa.ForeignKey('attributes.id'), nullable=False),
        sa.Column('value', sa.String(128), nullable=False),
        sa.Column('slug', sa.String(128), nullable=False),
        sa.Column('swatch_image_url', sa.String(512), nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0'),
    )
    op.create_index('ix_attribute_values_slug', 'attribute_values', ['slug'], unique=True)
    op.create_index('ix_attribute_values_attribute_id', 'attribute_values', ['attribute_id'])
    op.create_index('ix_attribute_values_attribute_id_sort', 'attribute_values', ['attribute_id', 'sort_order'])


def downgrade() -> None:
    op.drop_index('ix_attribute_values_attribute_id_sort', table_name='attribute_values')
    op.drop_index('ix_attribute_values_attribute_id', table_name='attribute_values')
    op.drop_index('ix_attribute_values_slug', table_name='attribute_values')
    op.drop_table('attribute_values')
    op.drop_index('ix_attributes_slug', table_name='attributes')
    op.drop_table('attributes')
