from pydantic import BaseModel
from typing import Optional


class IPKindOut(BaseModel):
    code: str
    category: str
    title: str
    term: Optional[str] = None
    registry: Optional[str] = None
    notes: Optional[str] = None


class IPKindsGrouped(BaseModel):
    category: str
    items: list[IPKindOut]
