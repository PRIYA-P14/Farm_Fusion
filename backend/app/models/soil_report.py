"""
Updated SoilReport model — image-based, no manual params, no weather, no farmer info.
"""
from typing import Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime


class SoilReportModel(BaseModel):
    """MongoDB document model for image-based soil analysis."""
    # Linked user
    userId: str
    userFullName: str

    # Image
    imagePath: str
    imageUrl: str

    # Farm context (minimal — kept from original)
    farmSize: float = 1.0
    crop: str = ""
    previousCrop: str = ""
    irrigationType: str = "Drip"
    season: str = "Kharif"
    notes: str = ""

    # AI-predicted soil parameters (from image analysis)
    predictedSoilType: str = ""
    predictedSoilColour: str = ""
    estimatedPH: float = 7.0
    estimatedEC: float = 0.5
    estimatedOC: float = 0.75
    estimatedNitrogen: float = 80.0
    estimatedPhosphorus: float = 40.0
    estimatedPotassium: float = 150.0
    moistureLevel: str = ""
    texture: str = ""
    organicMatter: str = ""
    healthScore: int = 0
    fertility: str = ""
    waterRetention: str = ""
    drainage: str = ""
    suitableCrops: list = []
    confidenceScore: float = 0.0

    # Full analysis result
    analysis: Optional[Any] = None

    createdAt: datetime = Field(default_factory=datetime.utcnow)
