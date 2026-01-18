from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    # 🔹 Привязка к IP-объекту
    ip_id = Column(Integer, ForeignKey("ip_objects.id", ondelete="CASCADE"), nullable=False)
    ip_object = relationship("IPObject", back_populates="documents")

    # 🔹 Имя файла и путь
    filename = Column(String(255), nullable=False)
    filepath = Column(String(512), nullable=False)

    # 🔹 Дата загрузки (автоматически выставляется на уровне БД)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)

    # 🔹 Привязка к контрагенту
    counterparty_id = Column(Integer, ForeignKey("counterparties.id", ondelete="SET NULL"), nullable=True)
    counterparty = relationship("Counterparty", back_populates="documents")
