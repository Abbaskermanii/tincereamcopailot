"""fix timestamps: otp_codes and coupon_redemptions + expiry tz

Revision ID: d9e0f2a3b4c5
Revises: c8d9e0f1a2b3
Create Date: 2026-08-30 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9e0f2a3b4c5'
down_revision: Union[str, None] = 'c8d9e0f1a2b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # otp_codes: add timestamps if missing, fix expires_at tz
    op.execute("ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()")
    op.execute("ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()")
    op.execute("ALTER TABLE otp_codes ALTER COLUMN expires_at TYPE timestamptz USING expires_at AT TIME ZONE 'UTC'")

    # coupon_redemptions: add timestamps if missing
    op.execute("ALTER TABLE coupon_redemptions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()")
    op.execute("ALTER TABLE coupon_redemptions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()")

    # refresh_tokens and password_reset_tokens: ensure expires_at is timestamptz
    op.execute("ALTER TABLE refresh_tokens ALTER COLUMN expires_at TYPE timestamptz USING expires_at AT TIME ZONE 'UTC'")
    op.execute("ALTER TABLE password_reset_tokens ALTER COLUMN expires_at TYPE timestamptz USING expires_at AT TIME ZONE 'UTC'")


def downgrade() -> None:
    op.execute("ALTER TABLE otp_codes DROP COLUMN IF EXISTS created_at")
    op.execute("ALTER TABLE otp_codes DROP COLUMN IF EXISTS updated_at")
    op.execute("ALTER TABLE coupon_redemptions DROP COLUMN IF EXISTS created_at")
    op.execute("ALTER TABLE coupon_redemptions DROP COLUMN IF EXISTS updated_at")
    # downgrade tz not needed
