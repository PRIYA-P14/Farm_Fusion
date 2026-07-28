"""Weather prompt templates."""

WEATHER_SYSTEM_PROMPT = "You are an expert agricultural meteorologist."

WEATHER_QUERY_TEMPLATE = """
Given the following weather data for {location}:
{weather_data}

Provide farming recommendations for the next {days} days.
"""
