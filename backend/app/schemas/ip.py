from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class IPCreate(BaseModel):
    title: str = Field(..., max_length=255)
    type: str = "trademark"  # legacy, хранится как Enum на бэке
    status: str = "draft"    # Enum(IPStatus)
    number: Optional[str] = None
    filing_date: Optional[date] = None
    registration_date: Optional[date] = None
    meta: Optional[dict] = None

    # новый подвид
    kind_code: Optional[str] = None


class IPItemOut(BaseModel):
    id: int
    type: str
    title: str
    status: str
    kind_code: Optional[str] = None
    kind_title: Optional[str] = None
    kind_term: Optional[str] = None
    kind_registry: Optional[str] = None
