"""add avatar_url column to users table

Revision ID: e6f7a8b9c0d4
Revises: d9e0f2a3b4c5
Create Date: 2026-08-31 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from typing import Sequence


# revision identifiers, used by Alembic.
revision: str = 'e6f7a8b9c0d4'
down_revision: str | None = 'd9e0f2a3b4c5'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users",
        sa.Column("avatar_url", sa.String(length=512), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_url")