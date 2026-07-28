"""Weather data models."""

from pydantic import BaseModel
from datetime import datetime


class WeatherData(BaseModel):
    location: str
    temperature: float
    humidity: float
    rainfall_mm: float
    wind_speed_kmh: float
    condition: str
    timestamp: datetime


class WeatherForecast(BaseModel):
    location: str
    forecasts: list[WeatherData]
    farming_advisory: str | None = None
