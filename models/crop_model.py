"""Crop data models."""

from pydantic import BaseModel


class CropRecommendation(BaseModel):
    crop_name: str
    suitability_score: float
    season: str
    expected_yield_kg_per_acre: float
    notes: str | None = None


class CropDiseaseAlert(BaseModel):
    crop_name: str
    disease_name: str
    severity: str
    treatment: str
    prevention: str
