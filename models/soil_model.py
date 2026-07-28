"""Soil data models."""

from pydantic import BaseModel


class SoilAnalysis(BaseModel):
    location: str
    ph_level: float
    nitrogen_ppm: float
    phosphorus_ppm: float
    potassium_ppm: float
    organic_matter_percent: float
    moisture_percent: float
    soil_type: str


class FertilizerRecommendation(BaseModel):
    fertilizer_name: str
    quantity_kg_per_acre: float
    application_method: str
    timing: str
