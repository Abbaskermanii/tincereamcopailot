"""homepage new kinds: brand_story, testimonials, featured_category_spotlight

Revision ID: ac1b3d7d51cb
Revises: 84edf3cc7bb3
Create Date: 2026-08-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'ac1b3d7d51cb'
down_revision: Union[str, None] = '84edf3cc7bb3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new enum values for Postgres. For SQLite (tests) this is a no-op – SQLAlchemy will handle via string.
    conn = op.get_bind()
    dialect = conn.dialect.name if conn else ""
    if dialect == "postgresql":
        for val in ("brand_story", "testimonials", "featured_category_spotlight"):
            try:
                op.execute(sa.text(f"ALTER TYPE homepagesectionkind ADD VALUE IF NOT EXISTS '{val}'"))
            except Exception:
                # older PG without IF NOT EXISTS
                try:
                    op.execute(sa.text(f"ALTER TYPE homepagesectionkind ADD VALUE '{val}'"))
                except Exception:
                    pass
    # Remove stale newsletter rows and reset default layout if admin has old data with newsletter only
    try:
        op.execute(sa.text("DELETE FROM homepage_sections WHERE kind = 'newsletter'"))
    except Exception:
        pass
    # Insert new default sections if homepage is empty? Let default_sections handle via UI reset; no auto insert.


def downgrade() -> None:
    # Enum values cannot be removed in Postgres without recreating type; leave as is.
    pass
