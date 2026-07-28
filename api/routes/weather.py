"""Weather route — Weather data and forecasts."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/current")
async def get_current_weather(location: str):
    # TODO: Return current weather for location
    pass


@router.get("/forecast")
async def get_forecast(location: str, days: int = 7):
    # TODO: Return weather forecast
    pass


@router.get("/advisory")
async def get_farming_advisory(location: str):
    # TODO: Return farming advisory based on weather
    pass
