"""API package — FastAPI application for AgriVerse-AI."""

from fastapi import FastAPI
from api.routes import agents, crops, weather, market, health

app = FastAPI(
    title="AgriVerse-AI API",
    description="Multi-Agent Agriculture Intelligence System",
    version="1.0.0",
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(weather.router, prefix="/weather", tags=["Weather"])
app.include_router(crops.router, prefix="/crops", tags=["Crops"])
app.include_router(market.router, prefix="/market", tags=["Market"])
