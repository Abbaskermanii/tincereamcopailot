"""add tax to orders

Revision ID: a1b2c3d4e5f6
Revises: 19ec71079e51
Create Date: 2026-08-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '19ec71079e51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('tax_rate', sa.Float(), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('tax_amount', sa.Float(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('orders', 'tax_amount')
    op.drop_column('orders', 'tax_rate')
