"""Weather service — Fetches and processes weather data."""


class WeatherService:
    async def get_current_weather(self, location: str) -> dict:
        # TODO: Integrate with weather API
        pass

    async def get_forecast(self, location: str, days: int = 7) -> dict:
        # TODO: Integrate with weather forecast API
        pass

    async def get_farming_advisory(self, location: str) -> str:
        # TODO: Generate farming advisory based on weather
        pass
