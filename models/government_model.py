"""Government scheme data models."""

from pydantic import BaseModel


class GovernmentScheme(BaseModel):
    scheme_name: str
    ministry: str
    description: str
    eligibility: str
    benefits: str
    application_url: str | None = None
    deadline: str | None = None


class SubsidyInfo(BaseModel):
    subsidy_name: str
    amount: float
    crop_type: str
    state: str
    eligibility_criteria: str
