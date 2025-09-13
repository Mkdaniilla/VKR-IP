"""create ip_objects and monitoring_tasks (idempotent)

Revision ID: a305c99da627
Revises: e6138badcbf5
Create Date: 2025-09-02 14:55:05.790327
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

# revision identifiers, used by Alembic.
revision: str = "a305c99da627"
down_revision: Union[str, Sequence[str], None] = "e6138badcbf5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _create_enum_if_not_exists():
    # ip_type_enum
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ip_type_enum') THEN
                CREATE TYPE ip_type_enum AS ENUM ('trademark','patent','copyright','design');
            END IF;
        END$$;
        """
    )
    # monitoring_status_enum
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'monitoring_status_enum') THEN
                CREATE TYPE monitoring_status_enum AS ENUM ('pending','running','done','failed');
            END IF;
        END$$;
        """
    )


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1) безопасно убедиться, что типы есть
    _create_enum_if_not_exists()

    # 2) использовать существующие типы без повторного создания
    ip_type = pg.ENUM("trademark", "patent", "copyright", "design",
                      name="ip_type_enum", create_type=False)
    mon_status = pg.ENUM("pending", "running", "done", "failed",
                         name="monitoring_status_enum", create_type=False)

    # 3) ip_objects — создать, если нет
    if "ip_objects" not in insp.get_table_names():
        op.create_table(
            "ip_objects",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "owner_id",
                sa.Integer(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
                index=True,  # индекс создастся автоматически
            ),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("ip_type", ip_type, nullable=False),
            sa.Column("classes", sa.JSON(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )

    # 4) monitoring_tasks — создать, если нет
    if "monitoring_tasks" not in insp.get_table_names():
        op.create_table(
            "monitoring_tasks",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "ip_object_id",
                sa.Integer(),
                sa.ForeignKey("ip_objects.id", ondelete="CASCADE"),
                nullable=False,
                index=True,  # индекс создастся автоматически
            ),
            sa.Column("query", sa.Text(), nullable=False),
            sa.Column("status", mon_status, nullable=False, server_default="pending"),
            sa.Column("result_summary", sa.JSON(), nullable=True),
            sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # удалить monitoring_tasks, если есть
    if "monitoring_tasks" in insp.get_table_names():
        op.drop_table("monitoring_tasks")

    # ip_objects не трогаем (есть зависимости)

    # попытаться удалить ENUM статусов, если он больше не используется
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_attribute a
                JOIN pg_class c ON a.attrelid = c.oid
                JOIN pg_type t ON a.atttypid = t.oid
                WHERE t.typname = 'monitoring_status_enum'
            ) THEN
                DROP TYPE IF EXISTS monitoring_status_enum;
            END IF;
        END$$;
        """
    )
    # ip_type_enum не удаляем
