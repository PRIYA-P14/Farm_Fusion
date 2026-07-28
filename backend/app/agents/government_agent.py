"""
Government Scheme AI Agent — uses Groq Llama 3.3 to generate scheme recommendations.
"""
import json
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"


def _build_prompt(farmer: dict, schemes: list) -> str:
    scheme_names = "\n".join(
        f"- {s['name']} ({s['category']}): {s['benefits']}" for s in schemes
    )
    return f"""You are an expert Indian government agriculture scheme advisor helping farmers access benefits.

## FARMER PROFILE
- Name: {farmer.get('farmer_name')}
- Age: {farmer.get('age')}, Gender: {farmer.get('gender')}
- State: {farmer.get('state')}, District: {farmer.get('district')}
- Category: {farmer.get('category')}, Farmer Type: {farmer.get('farmer_type')}
- Annual Income: Rs.{farmer.get('annual_income')}
- Farm Size: {farmer.get('farm_size')} acres
- Land Ownership: {farmer.get('land_ownership')}
- Crop: {farmer.get('crop')}
- Irrigation: {farmer.get('irrigation_type')}
- PM-KISAN Registered: {farmer.get('pm_kisan_registered')}
- Aadhaar Available: {farmer.get('aadhaar_available')}
- Bank Account: {farmer.get('bank_account_available')}

## ELIGIBLE SCHEMES IDENTIFIED
{scheme_names if scheme_names else "No schemes matched. Provide general guidance."}

Respond ONLY with valid raw JSON:
{{
  "summary": "2-3 sentence overview of farmer's eligibility situation",
  "top_priority": "Name of the single most important scheme for this farmer and why",
  "scheme_tips": [
    {{"scheme": "scheme name", "why_eligible": "reason", "key_benefit": "main benefit", "first_step": "immediate action"}}
  ],
  "documents_checklist": ["document 1", "document 2"],
  "application_guidance": "Step-by-step guidance in 3-4 sentences",
  "income_tips": "Tips to maximize benefits based on income level",
  "warning": "Any important caution or deadline the farmer should know",
  "motivational_message": "One encouraging sentence in farmer-friendly language"
}}"""


async def get_government_ai_recommendation(farmer: dict, schemes: list) -> dict:
    api_key = settings.GROQ_API_KEY
    if not api_key or api_key == "your_groq_api_key_here":
        return {"available": False, "reason": "Groq API key not configured"}

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are an expert Indian government agriculture scheme advisor. Always respond with valid raw JSON only."},
            {"role": "user", "content": _build_prompt(farmer, schemes)},
        ],
        "temperature": 0.3,
        "max_tokens": 1500,
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
        logger.error(f"Government Agent Groq error: {e}")
        return {"available": False, "reason": str(e)}
