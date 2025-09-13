"""create users table

Revision ID: e6138badcbf5
Revises:
Create Date: 2025-09-02 23:08:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "e6138badcbf5"
down_revision: Union[str, Sequence[str], None] = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
    )
    # Индекс на email уже создаётся автоматически за счёт unique=True
    # op.create_index("ix_users_email", "users", ["email"], unique=True)  <-- УБРАНО


def downgrade() -> None:
    op.drop_table("users")

