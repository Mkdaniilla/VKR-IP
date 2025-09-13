"""ip_objects add expires_at and safe indexes

Revision ID: b4df4c688bb9
Revises: a305c99da627
Create Date: 2025-09-04 13:41:55.401349
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b4df4c688bb9"
down_revision: Union[str, Sequence[str], None] = "a305c99da627"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1. Добавляем колонку expires_at в ip_objects
    with op.batch_alter_table("ip_objects") as b:
        b.add_column(sa.Column("expires_at", sa.Date(), nullable=True))

    # 2. Индекс для ip_objects.owner_id (IF NOT EXISTS)
    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind = 'i' AND c.relname = 'ix_ip_objects_owner_id'
          ) THEN
            CREATE INDEX ix_ip_objects_owner_id ON ip_objects (owner_id);
          END IF;
        END$$;
        """
    )

    # 3. Индекс для monitoring_tasks.ip_object_id (IF NOT EXISTS)
    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind = 'i' AND c.relname = 'ix_monitoring_tasks_ip_object_id'
          ) THEN
            CREATE INDEX ix_monitoring_tasks_ip_object_id ON monitoring_tasks (ip_object_id);
          END IF;
        END$$;
        """
    )


def downgrade() -> None:
    """Downgrade schema."""

    # Убираем колонку expires_at
    with op.batch_alter_table("ip_objects") as b:
        b.drop_column("expires_at")

    # Индексы оставляем — они безопасные и могут быть нужны
    # Если захочешь удалять, можно добавить:
    # op.drop_index("ix_ip_objects_owner_id", table_name="ip_objects")
    # op.drop_index("ix_monitoring_tasks_ip_object_id", table_name="monitoring_tasks")

