from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class FarmerInput(BaseModel):
    farmer_name: str
    age: int
    gender: str
    mobile: str
    state: str
    district: str
    village: Optional[str] = ""
    category: str  # General / SC / ST / OBC
    annual_income: float
    farm_size: float  # in acres
    land_ownership: str  # Owned / Leased
    crop: str
    irrigation_type: str
    pm_kisan_registered: bool = False
    aadhaar_available: bool = True
    bank_account_available: bool = True
    farmer_type: str  # Small / Marginal / Medium / Large


class SchemeResult(BaseModel):
    id: str
    name: str
    description: str
    type: str
    category: str
    benefits: str
    subsidy_amount: float
    loan_amount: float
    insurance: bool
    required_documents: List[str]
    official_website: str
    application_process: str
    priority: int


class GovernmentReportOut(BaseModel):
    id: str
    user_id: str
    farmer_name: str
    state: str
    district: str
    crop: str
    farmer_type: str
    annual_income: float
    farm_size: float
    eligible_schemes: List[SchemeResult]
    total_subsidy: float
    total_loan: float
    has_insurance: bool
    ai_recommendation: str
    created_at: datetime


class SoilContextInput(BaseModel):
    soilHealth: Optional[float] = None
    soilType: Optional[str] = None
    crop: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    risk: Optional[str] = None


class SearchParams(BaseModel):
    q: Optional[str] = None
    state: Optional[str] = None
    crop: Optional[str] = None
    category: Optional[str] = None
    farmer_type: Optional[str] = None
    page: int = 1
    limit: int = 10
