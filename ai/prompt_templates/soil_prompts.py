"""Soil prompt templates."""

SOIL_SYSTEM_PROMPT = "You are an expert soil scientist and agricultural advisor."

SOIL_ANALYSIS_TEMPLATE = """
Analyze the following soil data:
- pH: {ph_level}
- Nitrogen: {nitrogen_ppm} ppm
- Phosphorus: {phosphorus_ppm} ppm
- Potassium: {potassium_ppm} ppm
- Organic Matter: {organic_matter}%

Provide a soil health assessment and fertilizer recommendations for {crop_name}.
"""
