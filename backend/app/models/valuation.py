from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base



class ValuationRequest(Base):
    __tablename__ = "valuation_requests"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)

    ip_type = Column(String(50), nullable=False)
    jurisdictions = Column(ARRAY(String), nullable=False, default=[])
    brand_strength = Column(Integer, nullable=False)  # 1..10
    annual_revenue = Column(Numeric(18, 2), nullable=True)
    royalty_rate = Column(Numeric(5, 2), nullable=True)
    remaining_years = Column(Integer, nullable=False)
    market_reach = Column(String(30), nullable=False)  # local/region/national/international
    industry = Column(String(80), nullable=True)
    notes = Column(Text, nullable=True)
    ai_context = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 🔗 связь с пользователем
    user = relationship("User", back_populates="valuation_requests")

    # 🔗 связь с отчётом
    report = relationship(
        "ValuationReport",
        back_populates="request",
        uselist=False,
        cascade="all, delete-orphan"
    )


class ValuationReport(Base):
    __tablename__ = "valuation_reports"

    id = Column(Integer, primary_key=True)
    request_id = Column(Integer, ForeignKey("valuation_requests.id", ondelete="CASCADE"), nullable=False)
    baseline_value = Column(Numeric(18, 2), nullable=False)
    ai_adjustment = Column(Numeric(18, 2), nullable=False)
    final_value = Column(Numeric(18, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="RUB")
    multiples_used = Column(JSON, nullable=True)
    risk_discount = Column(Numeric(5, 2), nullable=True)
    pdf_path = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 🔗 связь с запросом
    request = relationship("ValuationRequest", back_populates="report")
