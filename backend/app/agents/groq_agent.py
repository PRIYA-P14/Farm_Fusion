"""
Groq AI Agent — builds narrative from image analysis results.
"""
import json
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"


def _build_prompt(soil_data: dict, engine_result: dict, user_name: str) -> str:
    hs = engine_result["healthScore"]
    cs = engine_result["cropSuitability"]
    yp = engine_result["yieldPrediction"]
    na = engine_result["nutrientAnalysis"]

    suitable_crops = ", ".join(c["crop"] for c in cs["suitable"]) or "None"
    issues_str     = ", ".join(f"{i['param']} {i['level']}" for i in na["issues"]) or "None"

    return f"""You are an expert agricultural soil scientist with 20+ years of experience in Indian farming.

A farmer named {user_name} has submitted their soil test results for analysis.

## FARMER & FARM DETAILS
- Farmer: {soil_data.get('farmerName', user_name)}
- Location: {soil_data.get('village', '')}, {soil_data.get('district', '')}, {soil_data.get('state', '')}
- Farm Size: {soil_data.get('farmSize', 1)} acres
- Crop: {soil_data.get('crop', 'Unknown')}
- Previous Crop: {soil_data.get('previousCrop', 'Unknown')}
- Season: {soil_data.get('season', 'Kharif')}
- Irrigation: {soil_data.get('irrigationType', 'Drip')}

## SOIL TEST PARAMETERS (Lab Measured)
- Soil Type: {soil_data.get('soilType', 'Unknown')}
- Soil Colour: {soil_data.get('soilColour', 'Unknown')}
- pH: {soil_data.get('soilPH', 7.0)}
- EC: {soil_data.get('electricalConductivity', 0.5)} dS/m
- Organic Carbon: {soil_data.get('organicCarbon', 0.75)}%
- Nitrogen: {soil_data.get('nitrogen', 80)} kg/ha
- Phosphorus: {soil_data.get('phosphorus', 40)} kg/ha
- Potassium: {soil_data.get('potassium', 150)} kg/ha
- Temperature: {soil_data.get('temperature', 28)}°C
- Humidity: {soil_data.get('humidity', 65)}%
- Rainfall: {soil_data.get('rainfall', 800)} mm/year

## PRE-COMPUTED ENGINE RESULTS
- Health Score: {hs['overall']}/100 ({hs['grade']})
- Suitable Crops: {suitable_crops}
- Issues: {issues_str}
- Predicted Yield: {yp['predicted']}

Respond ONLY with valid raw JSON:
{{
  "soilStory": "3-4 sentence plain English summary",
  "expertVerdict": "One powerful diagnosis sentence",
  "nutrientExplanation": {{
    "nitrogen": "explanation",
    "phosphorus": "explanation",
    "potassium": "explanation",
    "ph": "pH explanation",
    "organicCarbon": "OC explanation"
  }},
  "cropAdvice": [
    {{"crop": "name", "why": "reason", "expectedYield": "estimate", "keyTip": "tip"}}
  ],
  "fertilizerNarrative": "2-3 sentences",
  "irrigationAdvice": "2 sentences",
  "seasonalCalendar": [
    {{"month": "month", "task": "task", "reason": "reason"}}
  ],
  "organicFarmingPath": "2-3 sentences",
  "diseaseRisks": [
    {{"disease": "name", "risk": "High/Medium/Low", "prevention": "tip"}}
  ],
  "marketInsight": "2 sentences",
  "tamilSummary": "3-4 sentences in Tamil language summarising soil health, best crop and key advice for the farmer",
  "motivationalMessage": "One warm encouraging sentence"
}}"""


async def get_groq_analysis(soil_data: dict, engine_result: dict, user_name: str = "Farmer") -> dict:
    api_key = settings.GROQ_API_KEY
    if not api_key or api_key == "your_groq_api_key_here":
        return {"available": False, "reason": "Groq API key not configured"}

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are an expert agricultural soil scientist. Always respond with valid raw JSON only."},
            {"role": "user", "content": _build_prompt(soil_data, engine_result, user_name)},
        ],
        "temperature": 0.3,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"},
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"].strip()
            parsed = json.loads(text)
            return {"available": True, "model": MODEL, **parsed}
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return {"available": False, "reason": str(e)}
