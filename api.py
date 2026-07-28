"""
FastAPI wrapper for the Market Price Prediction Agent.

Run with:
    uvicorn api:app --reload --port 8004

Then open http://127.0.0.1:8004/docs to test it interactively.

This exposes the agent as an HTTP microservice so your team's multi-agent
orchestrator (or another teammate's agent) can call it over the network
instead of importing agent.py directly.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from agent import MarketPriceAgent
from data import CROPS, MARKETS

app = FastAPI(title="Market Price Prediction Agent", version="1.0.0")

# Allow the browser-based frontend (frontend/index.html, opened via file:// or
# a local dev server on a different port) to call this API. Wide open for a
# college project / local dev; if you ever deploy this, restrict allow_origins
# to your actual frontend's domain instead of "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = MarketPriceAgent()


class MarketQuery(BaseModel):
    crop: str = Field(..., examples=["Onion"])
    market: str = Field(..., examples=["Erode Market"])
    quantity_kg: float = Field(100, examples=[500])
    cost_price_per_kg: float = Field(0, examples=[12])
    farmer_lat: Optional[float] = Field(None, examples=[11.3814])
    farmer_lon: Optional[float] = Field(None, examples=[77.8949])


@app.get("/")
def root():
    return {"agent": "Market Price Prediction Agent", "status": "running"}


@app.get("/crops")
def list_crops():
    return {"crops": CROPS}


@app.get("/markets")
def list_markets():
    return {"markets": list(MARKETS.keys())}


@app.post("/predict")
def predict(query: MarketQuery):
    if query.crop not in CROPS:
        raise HTTPException(status_code=400, detail=f"Unknown crop. Choose from {CROPS}")
    if query.market not in MARKETS:
        raise HTTPException(status_code=400, detail=f"Unknown market. Choose from {list(MARKETS)}")
    try:
        return agent.run(query.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
