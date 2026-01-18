# Явные импорты всех моделей, чтобы SQLAlchemy зарегистрировал классы ДО первой конфигурации.

from .user import User  # noqa: F401

# Опциональные enum'ы — если модуля нет, тихо пропускаем
try:
    from .ip import IPType, IPStatus  # noqa: F401
except Exception:  # pragma: no cover
    IPType = None  # type: ignore
    IPStatus = None  # type: ignore

from .ip_kind import IPKind  # если используется у тебя (иначе строку можно убрать)  # noqa: F401
from .ip_objects import IPObject  # noqa: F401
from .deadline import Deadline  # noqa: F401
from .document import Document  # noqa: F401
from .monitoring import MonitoringTask, MonitoringStatus  # noqa: F401
from .knowledge import KnowledgeCategory, KnowledgeArticle  # noqa: F401
from .notification import Notification  # noqa: F401
from .counterparty import Counterparty  # noqa: F401
from . import valuation


__all__ = [
    "User",
    "IPType", "IPStatus",
    "IPKind",
    "IPObject",
    "Deadline",
    "Document",
    "MonitoringTask", "MonitoringStatus",
    "KnowledgeCategory", "KnowledgeArticle",
    "Notification",
    "Counterparty",
]
