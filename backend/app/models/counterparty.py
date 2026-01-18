from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Counterparty(Base):
    __tablename__ = "counterparties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)           # название: ООО Ромашка
    contact_person = Column(String(255), nullable=True)  # контактное лицо
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(512), nullable=True)

    # Владелец (привязка к пользователю)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner = relationship("User", back_populates="counterparties")

    # 🔹 Связь с Document через counterparty_id
    documents = relationship("Document", back_populates="counterparty")
