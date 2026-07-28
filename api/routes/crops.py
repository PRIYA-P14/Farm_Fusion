"""Crops route — Crop recommendations and disease detection."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/recommend")
async def recommend_crops(location: str, soil_type: str, season: str):
    # TODO: Return crop recommendations
    pass


@router.post("/disease")
async def detect_disease(crop_name: str):
    # TODO: Detect crop disease
    pass


@router.get("/yield")
async def predict_yield(crop_name: str, area_acres: float):
    # TODO: Predict crop yield
    pass
