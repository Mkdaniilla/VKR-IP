from sqlalchemy import Integer, ForeignKey, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)

    ip_id: Mapped[int | None] = mapped_column(ForeignKey("ip_objects.id", ondelete="SET NULL"), index=True, nullable=True)

    text: Mapped[str] = mapped_column(String(512), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    ip_object: Mapped["IPObject"] = relationship("IPObject", back_populates="notifications", passive_deletes=True)
