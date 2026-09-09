"""add address_id to orders

Revision ID: a1b2c3d4e5f6_addr
Revises: k0l1m2n3o4p5

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6_addr'
down_revision: Union[str, None] = 'k0l1m2n3o4p5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('address_id', sa.String(length=36), nullable=True))
    op.create_index('ix_orders_address_id', 'orders', ['address_id'])
    op.create_foreign_key(
        'fk_orders_address_id_addresses',
        'orders', 'addresses',
        ['address_id'], ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_orders_address_id_addresses', 'orders', type_='foreignkey')
    op.drop_index('ix_orders_address_id', table_name='orders')
    op.drop_column('orders', 'address_id')
