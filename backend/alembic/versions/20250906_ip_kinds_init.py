"""ip kinds dictionary + ip_objects.kind_code"""

from alembic import op
import sqlalchemy as sa

# ревизии
revision = "20250906_ip_kinds_init"
down_revision = "b4df4c688bb9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) таблица справочника
    op.create_table(
        "ip_kinds",
        sa.Column("code", sa.String(length=64), primary_key=True, nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("term", sa.String(length=128), nullable=True),
        sa.Column("registry", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    # 2) колонка kind_code в ip_objects (может существовать)
    with op.batch_alter_table("ip_objects") as b:
        if not _has_column("ip_objects", "kind_code"):
            b.add_column(sa.Column("kind_code", sa.String(length=64), nullable=True))
        # индекс
        b.create_index("ix_ip_objects_kind_code", ["kind_code"], unique=False)

    # 3) FK -> ip_kinds(code) ON DELETE SET NULL
    # сначала пробуем дропнуть если был c другим именем
    try:
        op.drop_constraint("ip_objects_kind_code_fkey", "ip_objects", type_="foreignkey")
    except Exception:
        pass

    op.create_foreign_key(
        "fk_ip_objects_kind_code",
        "ip_objects",
        "ip_kinds",
        ["kind_code"],
        ["code"],
        ondelete="SET NULL",
    )

    # 4) предзаполнение справочника
    conn = op.get_bind()
    data = [
        ("invention", "patent", "Изобретение", "20 лет", "Госреестр изобретений РФ", "Техническое решение в любой области"),
        ("utility_model", "patent", "Полезная модель", "10 лет", "Госреестр полезных моделей РФ", "Решение, относящееся к устройству"),
        ("industrial_design", "patent", "Промышленный образец", "до 25 лет (+продление)", "Госреестр промышленных образцов", "Внешний вид изделия"),
        ("copyright_work", "copyright", "Произведение науки, литературы и искусства", "жизнь автора + 70 лет", None, "Научные, литературные, художественные"),
        ("software", "copyright", "Программа для ЭВМ", "жизнь автора + 70 лет", "Роспатент (рег. ПО, опционально)", "Компьютерные программы"),
        ("database", "copyright", "База данных", "жизнь автора + 70 лет", "Роспатент (рег. БД, опционально)", "Совокупность данных"),
        ("topology_ics", "copyright", "Топология интегральных микросхем", None, None, "Микроэлектронное изделие"),
        ("trademark", "individualization", "Товарный знак / знак обслуживания", "10 лет (+продление)", "Госреестр товарных знаков", None),
        ("firm_name", "individualization", "Фирменное наименование", None, None, "Официальное название юридического лица"),
        ("commercial_designation", "individualization", "Коммерческое обозначение", None, None, "Не требует обязательной регистрации"),
        ("appellation_of_origin", "individualization", "НМПТ", None, "Госреестр НМПТ", None),
        ("geographical_indication", "individualization", "Географическое указание", None, "Госреестр ГУ", None),
        ("plant_variety", "other", "Селекционное достижение (сорт/порода)", None, "Госреестр селекционных достижений", None),
        ("know_how", "other", "Ноу-хау (секреты производства)", "пока не раскрыто", None, "Охраняется режимом конфиденциальности"),
    ]
    conn.execute(
        sa.text(
            "INSERT INTO ip_kinds(code,category,title,term,registry,notes) "
            "VALUES (:code,:category,:title,:term,:registry,:notes) "
            "ON CONFLICT (code) DO NOTHING"
        ),
        [dict(code=c, category=cat, title=t, term=term, registry=reg, notes=note) for c, cat, t, term, reg, note in data],
    )


def downgrade() -> None:
    try:
        op.drop_constraint("fk_ip_objects_kind_code", "ip_objects", type_="foreignkey")
    except Exception:
        pass
    with op.batch_alter_table("ip_objects") as b:
        try:
            b.drop_index("ix_ip_objects_kind_code")
        except Exception:
            pass
        if _has_column("ip_objects", "kind_code"):
            b.drop_column("kind_code")
    op.drop_table("ip_kinds")


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    return bind.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name=:t AND column_name=:c"
        ),
        {"t": table, "c": column},
    ).scalar() is not None
