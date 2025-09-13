from __future__ import annotations

from enum import Enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    JSON,
    Text,
    func
)
from sqlalchemy.orm import relationship
from app.database import Base


class MonitoringStatus(str, Enum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"


class MonitoringTask(Base):
    __tablename__ = "monitoring_tasks"

    id = Column(Integer, primary_key=True, index=True)
    ip_object_id = Column(Integer, ForeignKey("ip_objects.id", ondelete="CASCADE"), nullable=False, index=True)

    query = Column(Text, nullable=False)
    status = Column(
        SAEnum(MonitoringStatus, name="monitoring_status_enum"),
        nullable=False,
        default=MonitoringStatus.pending,
    )
    result_summary = Column(JSON, nullable=True)

    last_run_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    ip_object = relationship(
        "IPObject",
        back_populates="monitoring_tasks",
        passive_deletes=True,
    )
