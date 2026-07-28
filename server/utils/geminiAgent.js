/**
 * Gemini AI Agent
 * Uses Google Gemini 1.5 Flash to generate expert soil analysis narrative
 * Falls back gracefully if API key is missing or quota exceeded
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

function buildPrompt(data, engineResult) {
  const { healthScore, nutrientAnalysis, cropSuitability, yieldPrediction, risks } = engineResult;

  return `You are an expert agricultural soil scientist and agronomist with 20+ years of experience in Indian farming.

A farmer has submitted their soil test data. Analyse it thoroughly and provide expert recommendations.

## FARMER & FARM DETAILS
- Farmer: ${data.farmerName}, ${data.village}, ${data.district}, ${data.state}
- Farm Size: ${data.farmSize} acres
- Current Crop: ${data.crop} | Previous Crop: ${data.previousCrop}
- Season: ${data.season} | Irrigation: ${data.irrigationType}
- Soil Type: ${data.soilType} | Soil Colour: ${data.soilColour}

## SOIL TEST RESULTS
- pH: ${data.soilPH} | EC: ${data.electricalConductivity} dS/m | Organic Carbon: ${data.organicCarbon}%
- Nitrogen (N): ${data.nitrogen} kg/ha | Phosphorus (P): ${data.phosphorus} kg/ha | Potassium (K): ${data.potassium} kg/ha

## WEATHER CONDITIONS
- Temperature: ${data.temperature}°C | Humidity: ${data.humidity}% | Annual Rainfall: ${data.rainfall} mm

## PRE-COMPUTED ANALYSIS (use as reference)
- Soil Health Score: ${healthScore.overall}/100 (${healthScore.grade})
- Top Suitable Crops: ${cropSuitability.suitable.map(c => c.crop).join(', ') || 'None matched'}
- Key Issues: ${nutrientAnalysis.issues.map(i => `${i.param} is ${i.level}`).join(', ') || 'None'}
- Predicted Yield: ${yieldPrediction.predicted}
${data.notes ? `- Farmer Notes: ${data.notes}` : ''}

## YOUR TASK
Respond ONLY with a valid JSON object (no markdown, no code blocks, just raw JSON) with this exact structure:

{
  "soilStory": "3-4 sentence plain English summary of the overall soil condition, what it means for the farmer, and the most important thing they should do first",
  "expertVerdict": "One powerful sentence verdict like a doctor giving a diagnosis",
  "nutrientExplanation": {
    "nitrogen": "explain the nitrogen level in simple terms and what it means for crop growth",
    "phosphorus": "explain the phosphorus level in simple terms",
    "potassium": "explain the potassium level in simple terms",
    "ph": "explain what this pH means for nutrient availability and which crops it suits",
    "organicCarbon": "explain organic carbon importance and current status"
  },
  "cropAdvice": [
    {
      "crop": "crop name",
      "why": "why this crop suits this soil",
      "expectedYield": "realistic yield estimate",
      "keyTip": "single most important tip for this crop on this soil"
    }
  ],
  "fertilizerNarrative": "2-3 sentences explaining the fertilizer strategy in simple farmer-friendly language",
  "irrigationAdvice": "2 sentences on irrigation strategy based on soil type, crop, and rainfall",
  "seasonalCalendar": [
    { "month": "Month name or range", "task": "specific farming task", "reason": "why this month" }
  ],
  "organicFarmingPath": "2-3 sentences on how this farmer can transition to or improve organic farming",
  "governmentSchemes": [
    { "scheme": "scheme name", "benefit": "what benefit it provides", "eligibility": "who can apply" }
  ],
  "diseaseRisks": [
    { "disease": "disease or pest name", "risk": "High/Medium/Low", "prevention": "prevention tip" }
  ],
  "marketInsight": "2 sentences on market demand for the recommended crops in this region/season",
  "motivationalMessage": "One encouraging sentence for the farmer in a warm, respectful tone",
  "tamilSummary": "3 sentences summary in Tamil language for the farmer"
}

Be specific, practical, and use simple language a farmer can understand. Base all advice on the actual soil data provided.`;
}

async function getGeminiAnalysis(data, engineResult) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return { available: false, reason: 'Gemini API key not configured' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      }
    });

    const prompt = buildPrompt(data, engineResult);
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps in ```json ... ```
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return { available: true, ...parsed };
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return { available: false, reason: err.message };
  }
}

module.exports = { getGeminiAnalysis };
