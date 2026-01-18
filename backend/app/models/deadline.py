# app/models/deadline.py
from datetime import date
from sqlalchemy import Integer, ForeignKey, Date, String, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Deadline(Base):
    __tablename__ = "deadlines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ip_id: Mapped[int] = mapped_column(
        ForeignKey("ip_objects.id", ondelete="CASCADE"), index=True, nullable=False
    )
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(128), nullable=False)
    note: Mapped[str | None] = mapped_column(String(512))
    notified: Mapped[bool] = mapped_column(Boolean, default=False)

    # связь с IPObject
    ip_object = relationship("IPObject", back_populates="deadlines")


# индексы для ускорения запросов
Index("ix_deadlines_ip_id_due_date", Deadline.ip_id, Deadline.due_date)

