# app/models/__init__.py

# Явные импорты всех моделей, чтобы SQLAlchemy зарегистрировал классы
# ДО первой конфигурации мапперов/первых запросов.

from .user import User  # noqa: F401

# Опциональные enum'ы — если модуля нет, тихо пропускаем
try:
    from .ip import IPType, IPStatus  # noqa: F401
except Exception:
    IPType = None  # type: ignore
    IPStatus = None  # type: ignore

from .ip_objects import IPObject  # noqa: F401
from .deadline import Deadline  # noqa: F401
from .document import Document  # noqa: F401
from .monitoring import MonitoringTask, MonitoringStatus  # noqa: F401

__all__ = [
    "User",
    "IPType", "IPStatus",
    "IPObject",
    "Deadline",
    "Document",
    "MonitoringTask", "MonitoringStatus",
]
