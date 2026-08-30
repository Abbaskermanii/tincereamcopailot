"""add missing subtitle and variant image_url

Revision ID: c8d9e0f1a2b3
Revises: b7c9d1e2f4a6
Create Date: 2026-08-30 07:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c8d9e0f1a2b3'
down_revision: Union[str, None] = 'b7c9d1e2f4a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('carousels', sa.Column('subtitle', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True))
    op.add_column('product_variants', sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column('product_variants', 'image_url')
    op.drop_column('carousels', 'subtitle')
