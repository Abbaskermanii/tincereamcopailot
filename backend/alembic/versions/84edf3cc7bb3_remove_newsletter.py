"""remove newsletter subscription + homepage kind

Revision ID: 84edf3cc7bb3
Revises: b7c9d1e2f4a6
Create Date: 2026-08-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = '84edf3cc7bb3'
down_revision: Union[str, None] = 'b7c9d1e2f4a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove homepage sections with newsletter kind (enum value)
    # Use raw SQL to handle enum safely
    op.execute("DELETE FROM homepage_sections WHERE kind = 'newsletter'")
    # Drop newsletter_subscriptions table if exists (including indexes)
    # Use IF EXISTS to be idempotent
    op.execute("DROP TABLE IF EXISTS newsletter_subscriptions CASCADE")


def downgrade() -> None:
    # Recreate newsletter_subscriptions table
    op.create_table(
        'newsletter_subscriptions',
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('email', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('consent', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('unsubscribed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_newsletter_subscriptions_email'), 'newsletter_subscriptions', ['email'], unique=True)
    # Note: newsletter homepage kind enum value remains in DB type homepagesectionkind;
    # no need to re-add default section — admin can recreate if needed.
