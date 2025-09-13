"""add ip_id to notifications + FK"""

from alembic import op
import sqlalchemy as sa

revision = "5dd0c0bf777d"
down_revision = "20250906_ip_kinds_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    cols = [c["name"] for c in insp.get_columns("notifications")]
    if "ip_id" not in cols:
        op.add_column("notifications", sa.Column("ip_id", sa.Integer(), nullable=True))
        op.create_index("ix_notifications_ip_id", "notifications", ["ip_id"], unique=False)

    # FK -> ip_objects(id)
    try:
        op.drop_constraint("notifications_ip_id_fkey", "notifications", type_="foreignkey")
    except Exception:
        pass

    op.create_foreign_key(
        "notifications_ip_id_fkey",
        "notifications",
        "ip_objects",
        ["ip_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    try:
        op.drop_constraint("notifications_ip_id_fkey", "notifications", type_="foreignkey")
    except Exception:
        pass
    try:
        op.drop_index("ix_notifications_ip_id", table_name="notifications")
    except Exception:
        pass
    cols = [c["name"] for c in sa.inspect(op.get_bind()).get_columns("notifications")]
    if "ip_id" in cols:
        op.drop_column("notifications", "ip_id")
