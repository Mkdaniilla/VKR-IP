from __future__ import annotations
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field
from app.models.monitoring import MonitoringStatus


class MonTaskBase(BaseModel):
    ip_object_id: int
    query: str = Field(..., min_length=2, max_length=2000)

    class Config:
        orm_mode = True


class MonTaskCreate(MonTaskBase):
    pass


class MonTaskOut(BaseModel):
    id: int
    ip_object_id: int
    query: str
    status: MonitoringStatus
    result_summary: Optional[Dict[str, Any]] = None
    last_run_at: Optional[str] = None

    class Config:
        orm_mode = True
