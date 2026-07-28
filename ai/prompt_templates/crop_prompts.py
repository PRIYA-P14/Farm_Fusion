"""Crop prompt templates."""

CROP_SYSTEM_PROMPT = "You are an expert agronomist specializing in crop management."

CROP_RECOMMENDATION_TEMPLATE = """
Based on the following conditions:
- Location: {location}
- Soil Type: {soil_type}
- Season: {season}
- Weather: {weather_summary}

Recommend the top 3 crops to grow and explain why.
"""

DISEASE_DETECTION_TEMPLATE = """
The farmer reports the following symptoms on their {crop_name} crop:
{symptoms}

Identify the disease, severity, and recommended treatment.
"""
