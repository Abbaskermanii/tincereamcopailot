"""notifications table already exists; no-op revision

Revision ID: k0l1m2n3o4p5
Revises: j8k9l0m1n2o3

"""
from typing import Sequence, Union

revision: str = 'k0l1m2n3o4p5'
down_revision: Union[str, None] = 'j8k9l0m1n2o3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
