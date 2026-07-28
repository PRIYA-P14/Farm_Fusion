"""Resource optimization prompt templates."""

RESOURCE_SYSTEM_PROMPT = "You are an expert in sustainable agricultural resource management."

IRRIGATION_TEMPLATE = """
For a {area_acres} acre farm growing {crop_name} at growth stage {growth_stage}:
- Soil moisture: {soil_moisture}%
- Current weather: {weather_summary}

Provide an optimized irrigation schedule and water-saving recommendations.
"""
