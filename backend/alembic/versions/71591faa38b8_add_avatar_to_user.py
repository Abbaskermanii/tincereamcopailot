"""add avatar_url to users

Revision ID: 71591faa38b8
Revises: f3e4a9b8c7d6
Create Date: 2026-08-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = '71591faa38b8'
down_revision: Union[str, None] = 'f3e4a9b8c7d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('avatar_url', sqlmodel.sql.sqltypes.AutoString(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'avatar_url')
