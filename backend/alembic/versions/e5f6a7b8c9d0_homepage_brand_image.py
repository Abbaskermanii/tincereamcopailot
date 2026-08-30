"""Add image_url to homepage_sections for brand_story section.

Revision ID: e5f6a7b8c9d0
Revises: d9e0f2a3b4c5
Create Date: 2026-08-30
"""

from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d9e0f2a3b4c5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "homepage_sections",
        sa.Column("image_url", sa.String(length=1024), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("homepage_sections", "image_url")
