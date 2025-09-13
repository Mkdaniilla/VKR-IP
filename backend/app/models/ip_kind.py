from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class IPKind(Base):
    __tablename__ = "ip_kinds"

    code: Mapped[str] = mapped_column(String(64), primary_key=True)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    term: Mapped[str | None] = mapped_column(String(128), nullable=True)
    registry: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)
