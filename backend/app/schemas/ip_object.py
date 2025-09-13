from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IPObjectBase(BaseModel):
    title: str


class IPObjectCreate(IPObjectBase):
    pass


class IPObject(IPObjectBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True
