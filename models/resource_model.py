"""Resource optimization data models."""

from pydantic import BaseModel


class IrrigationPlan(BaseModel):
    crop_name: str
    water_requirement_liters_per_day: float
    irrigation_method: str
    schedule: str
    estimated_savings_percent: float


class ResourceUsage(BaseModel):
    farm_id: str
    water_used_liters: float
    energy_used_kwh: float
    fertilizer_used_kg: float
    date: str
