from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class DocumentOut(BaseModel):
    id: int
    filename: str
    filepath: str
    uploaded_at: Optional[datetime] = None   # 👈 теперь необязательно

    class Config:
        from_attributes = True
