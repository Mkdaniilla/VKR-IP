# app/models/ip_objects.py
from __future__ import annotations

import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Text, Enum, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class IPKindEnum(str, enum.Enum):
    trademark = "trademark"
    patent = "patent"
    copyright = "copyright"
    know_how = "know_how"
    design = "design"
    other = "other"


class IPObject(Base):
    __tablename__ = "ip_objects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    kind = Column(Enum(IPKindEnum), nullable=False)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # связи
    user = relationship("User", back_populates="ip_objects")

    monitoring_tasks = relationship(
        "MonitoringTask",
        back_populates="ip_object",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    documents = relationship(
        "Document",
        back_populates="ip",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    deadlines = relationship(
        "Deadline",
        back_populates="ip",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
