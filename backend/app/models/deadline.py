from datetime import date
from sqlalchemy import Integer, ForeignKey, Date, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Deadline(Base):
    __tablename__ = "deadlines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ip_id: Mapped[int] = mapped_column(ForeignKey("ip_objects.id", ondelete="CASCADE"))
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    kind: Mapped[str] = mapped_column(String(128), nullable=False)
    note: Mapped[str | None] = mapped_column(String(512))
    notified: Mapped[bool] = mapped_column(Boolean, default=False)

    ip = relationship("IPObject", back_populates="deadlines")

