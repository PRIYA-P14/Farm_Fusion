/**
 * Groq AI Agent
 * Uses Groq API (Llama 3.3 70B) for fast, expert soil analysis narrative
 * Falls back gracefully if API key is missing or quota exceeded
 */
const Groq = require('groq-sdk');
const crypto = require('crypto');

// Initialise client once at module level
const _apiKey = process.env.GROQ_API_KEY || '';
const groq = _apiKey ? new Groq({ apiKey: _apiKey }) : null;

function buildPrompt(data, engineResult, imageAnalysis) {
  const { healthScore, nutrientAnalysis, cropSuitability, yieldPrediction } = engineResult;

  const visionBlock = imageAnalysis ? `
## VISUAL SOIL ANALYSIS (AI Image Detection)
- Soil Colour: ${imageAnalysis.soilColour || 'N/A'}
- Texture: ${imageAnalysis.texture || 'N/A'}
- Moisture Level: ${imageAnalysis.moisture || 'N/A'}
- Organic Matter Visibility: ${imageAnalysis.organicMatter || 'N/A'}
- Estimated Soil Type: ${imageAnalysis.estimatedSoilType || 'N/A'}
- Surface Condition: ${imageAnalysis.surfaceCondition || 'N/A'}
- Visual Observations: ${imageAnalysis.visualObservations || 'N/A'}
` : '';

  return `You are an expert agricultural soil scientist and agronomist with 20+ years of experience in Indian farming.

A farmer has submitted their soil test data along with a soil image. Analyse it and respond ONLY with a valid JSON object — no markdown, no explanation, no code fences, just raw JSON.

## FARMER & FARM DETAILS
- Farmer: ${data.farmerName}, ${data.village}, ${data.district}, ${data.state}
- Farm Size: ${data.farmSize} acres | Crop: ${data.crop} | Previous Crop: ${data.previousCrop}
- Season: ${data.season} | Irrigation: ${data.irrigationType}
- Soil Type: ${data.soilType} | Soil Colour: ${data.soilColour}
${visionBlock}
## SOIL TEST RESULTS (User Entered)
- pH: ${data.soilPH} | EC: ${data.electricalConductivity} dS/m | Organic Carbon: ${data.organicCarbon}%
- Nitrogen: ${data.nitrogen} kg/ha | Phosphorus: ${data.phosphorus} kg/ha | Potassium: ${data.potassium} kg/ha

## WEATHER
- Temperature: ${data.temperature}°C | Humidity: ${data.humidity}% | Rainfall: ${data.rainfall} mm/year

## PRE-COMPUTED DATA
- Health Score: ${healthScore.overall}/100 (${healthScore.grade})
- Suitable Crops: ${cropSuitability.suitable.map(c => c.crop).join(', ') || 'None'}
- Issues: ${nutrientAnalysis.issues.map(i => `${i.param} ${i.level}`).join(', ') || 'None'}
- Predicted Yield: ${yieldPrediction.predicted}
${data.notes ? `- Farmer Notes: ${data.notes}` : ''}

Respond with this exact JSON structure:
{
  "soilStory": "3-4 sentence plain English summary of soil condition and most important action",
  "expertVerdict": "One powerful diagnosis sentence like a doctor giving verdict",
  "nutrientExplanation": {
    "nitrogen": "simple explanation of nitrogen level and crop impact",
    "phosphorus": "simple explanation of phosphorus level",
    "potassium": "simple explanation of potassium level",
    "ph": "what this pH means for nutrient availability",
    "organicCarbon": "organic carbon status and importance"
  },
  "cropAdvice": [
    { "crop": "name", "why": "why it suits this soil", "expectedYield": "yield estimate", "keyTip": "top tip for this crop" }
  ],
  "fertilizerNarrative": "2-3 sentences on fertilizer strategy in farmer-friendly language",
  "irrigationAdvice": "2 sentences on irrigation based on soil, crop and rainfall",
  "seasonalCalendar": [
    { "month": "month or range", "task": "farming task", "reason": "why this month" }
  ],
  "organicFarmingPath": "2-3 sentences on improving organic farming for this farm",
  "governmentSchemes": [
    { "scheme": "scheme name", "benefit": "what it provides", "eligibility": "who can apply" }
  ],
  "diseaseRisks": [
    { "disease": "disease or pest", "risk": "High/Medium/Low", "prevention": "prevention tip" }
  ],
  "marketInsight": "2 sentences on market demand for recommended crops in this region",
  "tamilSummary": "3-4 sentence summary in Tamil language for the farmer",
  "motivationalMessage": "One warm encouraging sentence for the farmer"
}`;
}

async function getGroqAnalysis(data, engineResult, imageAnalysis = null) {
  const placeholder = 'your_groq_api_key_here';
  // Timing-safe check: no key, or key matches placeholder
  const noKey = !_apiKey;
  const isPlaceholder = _apiKey.length === placeholder.length &&
    crypto.timingSafeEqual(Buffer.from(_apiKey), Buffer.from(placeholder));

  if (noKey || isPlaceholder || !groq) {
    return { available: false, reason: 'Groq API key not configured. Add GROQ_API_KEY to server/.env' };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert agricultural soil scientist. Always respond with valid raw JSON only — no markdown, no code blocks, no extra text.'
        },
        {
          role: 'user',
      content: buildPrompt(data, engineResult, imageAnalysis)
        }
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content?.trim();
    const parsed = JSON.parse(text);

    return { available: true, model: 'llama-3.3-70b-versatile', ...parsed };
  } catch (err) {
    console.error('Groq API error:', err.message);
    return { available: false, reason: err.message };
  }
}

module.exports = { getGroqAnalysis };
