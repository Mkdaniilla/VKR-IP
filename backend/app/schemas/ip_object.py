from pydantic import BaseModel, ConfigDict
from enum import Enum
from typing import Optional, List
from datetime import date
from .document import DocumentOut


class IPType(str, Enum):
    """
    Классификация объектов интеллектуальной собственности согласно ГК РФ
    """
    # 1. Результаты творческой деятельности (Авторское и смежные права)
    literary_work = "literary_work"
    software = "software"
    database = "database"
    performance = "performance"
    phonogram = "phonogram"
    broadcast = "broadcast"
    
    # 2. Объекты промышленной собственности
    invention = "invention"
    utility_model = "utility_model"
    industrial_design = "industrial_design"
    plant_variety = "plant_variety"
    topology = "topology"
    
    # 3. Средства индивидуализации
    trademark = "trademark"
    trade_name = "trade_name"
    commercial_designation = "commercial_designation"
    geographical_indication = "geographical_indication"
    
    # 4. Нетрадиционные объекты
    know_how = "know_how"
    
    # Прочее
    other = "other"


class IPStatus(str, Enum):
    draft = "draft"
    filed = "filed"
    registered = "registered"
    expired = "expired"


class IPObjectBase(BaseModel):
    title: str
    type: IPType
    number: Optional[str] = None
    registration_date: Optional[date] = None
    owner_name: Optional[str] = None


class IPObjectCreate(IPObjectBase):
    pass


class IPObjectUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[IPType] = None
    number: Optional[str] = None
    registration_date: Optional[date] = None
    owner_name: Optional[str] = None
    status: Optional[IPStatus] = None


class IPObjectOut(IPObjectBase):
    id: int
    owner_id: int
    status: IPStatus
    estimated_value: Optional[float] = None
    report_path: Optional[str] = None
    documents: List[DocumentOut] = []

    # 👈 ОБНОВЛЕНО: Используем model_config для Pydantic v2
    model_config = ConfigDict(from_attributes=True)