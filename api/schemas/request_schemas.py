"""Request schemas for API endpoints."""

from pydantic import BaseModel


class AgentQueryRequest(BaseModel):
    query: str
    context: dict | None = None


class CropRecommendationRequest(BaseModel):
    location: str
    soil_type: str
    season: str
    area_acres: float | None = None


class SoilAnalysisRequest(BaseModel):
    ph_level: float
    nitrogen_ppm: float
    phosphorus_ppm: float
    potassium_ppm: float
    location: str
