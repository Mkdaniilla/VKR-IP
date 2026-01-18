from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from .ip_object import IPObjectOut

class AssessmentPayload(BaseModel):
    brand_strength: int = Field(..., gt=0, le=10)
    annual_revenue: float = Field(..., ge=0)
    royalty_rate: float = Field(..., ge=0, le=100)
    market_reach: str
    industry: str
    currency: str = "RUB"
    # New pro fields
    legal_robustness: List[str] = []
    scope_protection: int = 5
    valuation_purpose: str = "market"
    cost_rd: float = 0

class ValuationCreate(BaseModel):
    ip_type: str
    jurisdictions: List[str]
    brand_strength: int
    annual_revenue: float = 0
    royalty_rate: float = 0
    remaining_years: int
    market_reach: str
    industry: Optional[str] = None
    currency: str = "RUB"
    
    # New pro fields
    legal_robustness: List[str] = []
    scope_protection: int = 5
    valuation_purpose: str = "market"
    cost_rd: float = 0
    ip_object_id: Optional[int] = None
    
    # Subtype and specific metrics
    subtype: str = ""
    subtype_metrics: Dict[str, float] = {}

class ValuationOut(BaseModel):
    id: int
    baseline_value: float
    ai_adjustment: float
    final_value: float
    currency: str
    risk_discount: Optional[float]
    multiples_used: Dict[str, Any]
    pdf_url: str
    ip_object: Optional[IPObjectOut] = None
    model_config = ConfigDict(from_attributes=True)