"""drop tm_applications

Revision ID: 7daaef585407
Revises: c4d3f09347ac
Create Date: 2026-01-11 12:51:49.488282

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7daaef585407'
down_revision: Union[str, Sequence[str], None] = 'c4d3f09347ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table("tm_applications")


def downgrade() -> None:
    """Downgrade schema."""
    # Обычно не откатываем удаление такой таблицы
    pass
