from datetime import date
from pydantic import BaseModel

class DeadlineBase(BaseModel):
    ip_id: int
    due_date: date
    kind: str
    note: str | None = None

class DeadlineCreate(DeadlineBase):
    pass

class DeadlineUpdate(BaseModel):
    due_date: date | None = None
    kind: str | None = None
    note: str | None = None
    notified: bool | None = None

class DeadlineOut(DeadlineBase):
    id: int
    notified: bool

    class Config:
        from_attributes = True
