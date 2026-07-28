"""
FastAPI wrapper for the Crop Health Agent.

Run with:
    uvicorn api:app --reload --port 8005

Then open http://127.0.0.1:8005/docs to test it interactively.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from agent import CropHealthAgent
from data import SUPPORTED_CROPS, DISEASE_DB

app = FastAPI(title="Crop Health Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = CropHealthAgent()


class HealthQuery(BaseModel):
    crop: str = Field(..., examples=["Tomato"])
    symptoms: list[str] = Field(..., examples=[["yellow leaves", "brown spots", "wilting"]])
    field_area_acres: Optional[float] = Field(1.0, examples=[2.5])
    expected_yield_kg_per_acre: Optional[float] = Field(500, examples=[800])


@app.get("/")
def root():
    return {"agent": "Crop Health Agent", "status": "running"}


@app.get("/crops")
def list_crops():
    return {"crops": SUPPORTED_CROPS}


@app.get("/diseases")
def list_diseases():
    return {"diseases": [{"id": k, "name": v["name"], "crop": v["crop"]} for k, v in DISEASE_DB.items()]}


@app.post("/diagnose")
def diagnose(query: HealthQuery):
    if query.crop.strip().title() not in SUPPORTED_CROPS:
        raise HTTPException(status_code=400, detail=f"Unsupported crop. Choose from {SUPPORTED_CROPS}")
    if not query.symptoms:
        raise HTTPException(status_code=400, detail="Provide at least one symptom.")
    try:
        return agent.run(query.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
