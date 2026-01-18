from logging.config import fileConfig
import os
import sys
from pathlib import Path
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# === Настройка путей ===
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# === Загрузка .env (если есть) ===
backend_env = BASE_DIR / "backend" / ".env"
root_env = BASE_DIR / ".env"
if backend_env.exists():
    load_dotenv(backend_env)
elif root_env.exists():
    load_dotenv(root_env)

# === Конфиг Alembic ===
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# === Импортируем модели ===
from app.database import Base  # noqa
from app.models import (  # noqa
    user,
    ip,
    ip_kind,
    ip_objects,
    document,
    monitoring,
    deadline,
    notification,
    counterparty,
    knowledge,
)

target_metadata = Base.metadata

# === URL для подключения ===
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    config.set_main_option("sqlalchemy.url", DATABASE_URL)
else:
    config.set_main_option("sqlalchemy.url", "sqlite:///app.db")


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
