"""Add tags to articles

Revision ID: j8k9l0m1n2o3
Revises: h7i8j9k0l1m2
Create Date: 2026-09-06

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'j8k9l0m1n2o3'
down_revision: Union[str, None] = 'h7i8j9k0l1m2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags VARCHAR(500) DEFAULT ''")


def downgrade() -> None:
    op.execute("ALTER TABLE articles DROP COLUMN IF EXISTS tags")
