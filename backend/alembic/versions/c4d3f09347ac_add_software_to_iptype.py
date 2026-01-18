"""add software to iptype"""

from alembic import op
import sqlalchemy as sa


revision = 'c4d3f09347ac'
down_revision = 'e9af8804b645'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # SQLite — пропускаем
    if conn.dialect.name == "sqlite":
        print("SQLite detected — skipping ENUM alteration")
        return

    # PostgreSQL
    op.execute("ALTER TYPE iptype ADD VALUE IF NOT EXISTS 'software';")


def downgrade():
    pass
