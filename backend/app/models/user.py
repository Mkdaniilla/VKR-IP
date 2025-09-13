from sqlalchemy import Column, Integer, String, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):  # 🔄 Переименовал для ясности
    admin = "admin"
    lawyer = "lawyer"
    client = "client"
    partner = "partner"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.client, nullable=False)

    # models/user.py
    ip_objects = relationship("IPObject", back_populates="user", cascade="all, delete-orphan")

