"""knowledge per user

Revision ID: 9b2c1f6a3d10
Revises: 7daaef585407
Create Date: 2026-01-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9b2c1f6a3d10"
down_revision: Union[str, Sequence[str], None] = "7daaef585407"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _upgrade_sqlite() -> None:
    # SQLite: нельзя дропать sqlite_autoindex_... (UNIQUE/PK).
    # Поэтому пересобираем таблицы вручную.

    bind = op.get_bind()

    # На время переименований отключаем FK
    bind.execute(sa.text("PRAGMA foreign_keys=OFF"))

    # --- knowledge_categories: rebuild ---
    op.create_table(
        "knowledge_categories__new",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "title", name="uq_knowledge_category_user_title"),
    )
    op.create_index(
        "ix_knowledge_categories_user_id",
        "knowledge_categories__new",
        ["user_id"],
        unique=False,
    )

    # Переносим данные (старые записи — к user_id=1)
    bind.execute(sa.text("""
        INSERT INTO knowledge_categories__new (id, user_id, title)
        SELECT id, 1 as user_id, title
        FROM knowledge_categories
    """))

    op.drop_table("knowledge_categories")
    op.rename_table("knowledge_categories__new", "knowledge_categories")

    # --- knowledge_articles: rebuild ---
    op.create_table(
        "knowledge_articles__new",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["knowledge_categories.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "title", name="uq_knowledge_article_user_title"),
    )
    op.create_index(
        "ix_knowledge_articles_user_id",
        "knowledge_articles__new",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_knowledge_articles_category_id",
        "knowledge_articles__new",
        ["category_id"],
        unique=False,
    )

    bind.execute(sa.text("""
        INSERT INTO knowledge_articles__new (id, user_id, category_id, title, content)
        SELECT id, 1 as user_id, category_id, title, content
        FROM knowledge_articles
    """))

    op.drop_table("knowledge_articles")
    op.rename_table("knowledge_articles__new", "knowledge_articles")

    bind.execute(sa.text("PRAGMA foreign_keys=ON"))


def _upgrade_non_sqlite() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    with op.batch_alter_table("knowledge_categories") as batch:
        batch.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch.create_index("ix_knowledge_categories_user_id", ["user_id"], unique=False)
        batch.create_foreign_key(
            "fk_knowledge_categories_user_id_users",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )
        # Для Postgres обычно надо убрать старый UNIQUE(title)
        try:
            batch.drop_constraint("knowledge_categories_title_key", type_="unique")
        except Exception:
            pass

        batch.create_unique_constraint(
            "uq_knowledge_category_user_title",
            ["user_id", "title"],
        )

    with op.batch_alter_table("knowledge_articles") as batch:
        batch.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch.create_index("ix_knowledge_articles_user_id", ["user_id"], unique=False)
        batch.create_foreign_key(
            "fk_knowledge_articles_user_id_users",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )
        batch.create_unique_constraint(
            "uq_knowledge_article_user_title",
            ["user_id", "title"],
        )

    op.execute("UPDATE knowledge_categories SET user_id = 1 WHERE user_id IS NULL")
    op.execute("UPDATE knowledge_articles SET user_id = 1 WHERE user_id IS NULL")

    with op.batch_alter_table("knowledge_categories") as batch:
        batch.alter_column("user_id", existing_type=sa.Integer(), nullable=False)

    with op.batch_alter_table("knowledge_articles") as batch:
        batch.alter_column("user_id", existing_type=sa.Integer(), nullable=False)


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        _upgrade_sqlite()
    else:
        _upgrade_non_sqlite()


def downgrade() -> None:
    # Для dev можно оставить пустым или реализовать обратную пересборку.
    # Обычно downgrade в проде не используется.
    pass
