from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SAEnum, Date, Float
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class IPType(str, enum.Enum):
    """
    Классификация объектов интеллектуальной собственности согласно ГК РФ
    """
    # 1. Результаты творческой деятельности (Авторское и смежные права)
    literary_work = "literary_work"          # Произведения науки, литературы и искусства
    software = "software"                    # Программы для ЭВМ
    database = "database"                    # Базы данных
    performance = "performance"              # Исполнения
    phonogram = "phonogram"                  # Фонограммы
    broadcast = "broadcast"                  # Сообщения радио- и телепередач
    
    # 2. Объекты промышленной собственности
    invention = "invention"                  # Изобретения
    utility_model = "utility_model"          # Полезные модели
    industrial_design = "industrial_design"  # Промышленные образцы
    plant_variety = "plant_variety"          # Селекционные достижения
    topology = "topology"                    # Топологии интегральных микросхем
    
    # 3. Средства индивидуализации
    trademark = "trademark"                  # Товарные знаки и знаки обслуживания
    trade_name = "trade_name"                # Фирменные наименования
    commercial_designation = "commercial_designation"  # Коммерческие обозначения
    geographical_indication = "geographical_indication"  # Географические указания и НМПТ
    
    # 4. Нетрадиционные объекты
    know_how = "know_how"                    # Секреты производства (ноу-хау)
    
    # Прочее
    other = "other"


class IPStatus(str, enum.Enum):
    draft = "draft"
    filed = "filed"
    registered = "registered"
    expired = "expired"


class IPObject(Base):
    __tablename__ = "ip_objects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)

    # тип (товарный знак, патент, и т.д.)
    type = Column(SAEnum(IPType), nullable=False, default=IPType.trademark)

    # статус (черновик, подано, зарегистрировано, истекло)
    status = Column(SAEnum(IPStatus), nullable=False, default=IPStatus.draft)

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner = relationship("User", back_populates="ip_objects")

    # 🔹 новые поля для автодокументов
    number = Column(String(128), nullable=True)             # номер свидетельства/патента
    registration_date = Column(Date, nullable=True)         # дата регистрации
    owner_name = Column(String(256), nullable=True)         # владелец (например, юр. лицо/ИП)

    # 🔹 новые поля для AI-оценки и отчётов
    estimated_value = Column(Float, nullable=True)          # рассчитанная стоимость (капитализация)
    report_path = Column(String(512), nullable=True)        # путь к PDF-отчёту об оценке

    # связь с Deadlines
    deadlines = relationship("Deadline", back_populates="ip_object", cascade="all, delete-orphan")

    # связь с Documents
    documents = relationship("Document", back_populates="ip_object", cascade="all, delete-orphan")

    # связь с MonitoringTasks
    monitoring_tasks = relationship("MonitoringTask", back_populates="ip_object", cascade="all, delete-orphan")

    # 🔹 связь с Notifications
    notifications = relationship("Notification", back_populates="ip_object", cascade="all, delete-orphan")
