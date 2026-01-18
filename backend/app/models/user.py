from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # 🔹 связи
    ip_objects = relationship("IPObject", back_populates="owner", cascade="all, delete-orphan")
    counterparties = relationship("Counterparty", back_populates="owner", cascade="all, delete-orphan")

    # 🔹 новая связь с ValuationRequest
    valuation_requests = relationship(
        "ValuationRequest",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    # 🔹 база знаний (персональная)
    knowledge_categories = relationship(
        "KnowledgeCategory",
        back_populates="owner",
        cascade="all, delete-orphan",
    )
    knowledge_articles = relationship(
        "KnowledgeArticle",
        back_populates="owner",
        cascade="all, delete-orphan",
    )
