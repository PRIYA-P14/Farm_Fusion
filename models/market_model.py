"""Market data models."""

from pydantic import BaseModel
from datetime import date


class MarketPrice(BaseModel):
    crop_name: str
    market_name: str
    price_per_quintal: float
    date: date
    state: str


class MarketTrend(BaseModel):
    crop_name: str
    trend: str
    forecast_price: float
    recommendation: str
