/**
 * Soil Intelligence AI Engine
 * Rule-based expert system for soil analysis and agricultural recommendations
 */

// ─── Crop Database ────────────────────────────────────────────────────────────
const CROP_DB = {
  Rice:       { ph: [5.5, 7.0], n: [80, 120], p: [40, 60], k: [40, 60], seasons: ['Kharif'], water: 'High', soilTypes: ['Clay', 'Loamy'] },
  Wheat:      { ph: [6.0, 7.5], n: [100, 150], p: [50, 70], k: [40, 60], seasons: ['Rabi'], water: 'Medium', soilTypes: ['Loamy', 'Sandy Loam'] },
  Maize:      { ph: [5.8, 7.0], n: [100, 140], p: [50, 70], k: [50, 70], seasons: ['Kharif', 'Rabi'], water: 'Medium', soilTypes: ['Loamy', 'Sandy Loam', 'Clay Loam'] },
  Cotton:     { ph: [6.0, 8.0], n: [80, 120], p: [40, 60], k: [40, 60], seasons: ['Kharif'], water: 'Medium', soilTypes: ['Black', 'Clay Loam'] },
  Sugarcane:  { ph: [6.0, 7.5], n: [150, 200], p: [60, 80], k: [80, 100], seasons: ['Annual'], water: 'High', soilTypes: ['Loamy', 'Clay Loam'] },
  Soybean:    { ph: [6.0, 7.0], n: [20, 40], p: [50, 70], k: [40, 60], seasons: ['Kharif'], water: 'Medium', soilTypes: ['Loamy', 'Clay Loam'] },
  Groundnut:  { ph: [5.5, 7.0], n: [20, 40], p: [40, 60], k: [40, 60], seasons: ['Kharif', 'Rabi'], water: 'Low', soilTypes: ['Sandy Loam', 'Loamy'] },
  Tomato:     { ph: [5.5, 7.0], n: [100, 150], p: [60, 80], k: [80, 100], seasons: ['Rabi', 'Summer'], water: 'Medium', soilTypes: ['Loamy', 'Sandy Loam'] },
  Onion:      { ph: [6.0, 7.5], n: [80, 120], p: [50, 70], k: [60, 80], seasons: ['Rabi'], water: 'Medium', soilTypes: ['Loamy', 'Sandy Loam'] },
  Chickpea:   { ph: [6.0, 8.0], n: [20, 40], p: [40, 60], k: [20, 40], seasons: ['Rabi'], water: 'Low', soilTypes: ['Loamy', 'Sandy Loam', 'Black'] },
  Mustard:    { ph: [6.0, 7.5], n: [60, 100], p: [30, 50], k: [30, 50], seasons: ['Rabi'], water: 'Low', soilTypes: ['Loamy', 'Sandy Loam'] },
  Sunflower:  { ph: [6.0, 7.5], n: [60, 100], p: [40, 60], k: [40, 60], seasons: ['Kharif', 'Rabi'], water: 'Medium', soilTypes: ['Loamy', 'Sandy Loam'] },
  Turmeric:   { ph: [5.5, 7.0], n: [100, 150], p: [50, 70], k: [80, 100], seasons: ['Kharif'], water: 'High', soilTypes: ['Loamy', 'Clay Loam'] },
  Banana:     { ph: [6.0, 7.5], n: [150, 200], p: [60, 80], k: [150, 200], seasons: ['Annual'], water: 'High', soilTypes: ['Loamy', 'Clay Loam'] },
  Mango:      { ph: [5.5, 7.5], n: [80, 120], p: [40, 60], k: [60, 80], seasons: ['Annual'], water: 'Low', soilTypes: ['Loamy', 'Sandy Loam', 'Red'] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

function scoreParam(value, ideal_min, ideal_max, hard_min, hard_max) {
  if (value >= ideal_min && value <= ideal_max) return 100;
  if (value < ideal_min) return clamp(((value - hard_min) / (ideal_min - hard_min)) * 100, 0, 100);
  return clamp(((hard_max - value) / (hard_max - ideal_max)) * 100, 0, 100);
}

// ─── Core Analysis ────────────────────────────────────────────────────────────
function analyseNutrients(data) {
  const { nitrogen: n, phosphorus: p, potassium: k, soilPH: ph, electricalConductivity: ec, organicCarbon: oc } = data;
  const issues = [];
  const strengths = [];

  // Nitrogen
  if (n < 40)       issues.push({ param: 'Nitrogen', level: 'Very Low', severity: 'critical', value: n, unit: 'kg/ha' });
  else if (n < 80)  issues.push({ param: 'Nitrogen', level: 'Low', severity: 'warning', value: n, unit: 'kg/ha' });
  else if (n > 200) issues.push({ param: 'Nitrogen', level: 'Excess', severity: 'warning', value: n, unit: 'kg/ha' });
  else              strengths.push({ param: 'Nitrogen', level: 'Optimal', value: n, unit: 'kg/ha' });

  // Phosphorus
  if (p < 15)       issues.push({ param: 'Phosphorus', level: 'Very Low', severity: 'critical', value: p, unit: 'kg/ha' });
  else if (p < 30)  issues.push({ param: 'Phosphorus', level: 'Low', severity: 'warning', value: p, unit: 'kg/ha' });
  else if (p > 100) issues.push({ param: 'Phosphorus', level: 'Excess', severity: 'warning', value: p, unit: 'kg/ha' });
  else              strengths.push({ param: 'Phosphorus', level: 'Optimal', value: p, unit: 'kg/ha' });

  // Potassium
  if (k < 100)      issues.push({ param: 'Potassium', level: 'Very Low', severity: 'critical', value: k, unit: 'kg/ha' });
  else if (k < 150) issues.push({ param: 'Potassium', level: 'Low', severity: 'warning', value: k, unit: 'kg/ha' });
  else if (k > 400) issues.push({ param: 'Potassium', level: 'Excess', severity: 'warning', value: k, unit: 'kg/ha' });
  else              strengths.push({ param: 'Potassium', level: 'Optimal', value: k, unit: 'kg/ha' });

  // pH
  if (ph < 5.5)       issues.push({ param: 'Soil pH', level: 'Strongly Acidic', severity: 'critical', value: ph, unit: '' });
  else if (ph < 6.0)  issues.push({ param: 'Soil pH', level: 'Moderately Acidic', severity: 'warning', value: ph, unit: '' });
  else if (ph > 8.5)  issues.push({ param: 'Soil pH', level: 'Strongly Alkaline', severity: 'critical', value: ph, unit: '' });
  else if (ph > 7.5)  issues.push({ param: 'Soil pH', level: 'Moderately Alkaline', severity: 'warning', value: ph, unit: '' });
  else                strengths.push({ param: 'Soil pH', level: 'Optimal', value: ph, unit: '' });

  // EC
  if (ec > 4.0)       issues.push({ param: 'Electrical Conductivity', level: 'Very High (Saline)', severity: 'critical', value: ec, unit: 'dS/m' });
  else if (ec > 2.0)  issues.push({ param: 'Electrical Conductivity', level: 'High', severity: 'warning', value: ec, unit: 'dS/m' });
  else                strengths.push({ param: 'Electrical Conductivity', level: 'Normal', value: ec, unit: 'dS/m' });

  // Organic Carbon
  if (oc < 0.5)       issues.push({ param: 'Organic Carbon', level: 'Very Low', severity: 'critical', value: oc, unit: '%' });
  else if (oc < 0.75) issues.push({ param: 'Organic Carbon', level: 'Low', severity: 'warning', value: oc, unit: '%' });
  else if (oc > 2.0)  strengths.push({ param: 'Organic Carbon', level: 'High (Excellent)', value: oc, unit: '%' });
  else                strengths.push({ param: 'Organic Carbon', level: 'Adequate', value: oc, unit: '%' });

  return { issues, strengths };
}

// Visual property bonus scores — image-detected fields contribute up to 10 points
function visualBonus(data) {
  let bonus = 0;

  // Moisture: Moderate is ideal for most crops
  const moistureScore = { Wet: 3, Moist: 7, Moderate: 10, Dry: 4 };
  bonus += (moistureScore[data.moisture] ?? 5) * 0.30;

  // Organic matter visibility
  const omScore = { High: 10, Moderate: 7, Low: 3 };
  bonus += (omScore[data.organicMatter] ?? 5) * 0.35;

  // Texture: Loamy/Medium is ideal
  const textureScore = { Fine: 7, Medium: 10, Coarse: 5, Gritty: 4, Silty: 8, Clayey: 6 };
  bonus += (textureScore[data.texture] ?? 5) * 0.20;

  // Soil type fertility ranking
  const soilTypeScore = {
    'Black Cotton': 10, 'Alluvial': 9, 'Clay Loam': 8, 'Loamy': 8,
    'Clay': 7, 'Sandy Loam': 6, 'Red': 5, 'Laterite': 4, 'Sandy': 3,
  };
  const st = data.soilType || '';
  const stKey = Object.keys(soilTypeScore).find(k => st.toLowerCase().includes(k.toLowerCase()));
  bonus += (soilTypeScore[stKey] ?? 5) * 0.15;

  return bonus; // 0–10 range
}

function calculateHealthScore(data) {
  const ph = Number(data.soilPH);
  const ec = Number(data.electricalConductivity);
  const oc = Number(data.organicCarbon);
  const n  = Number(data.nitrogen);
  const p  = Number(data.phosphorus);
  const k  = Number(data.potassium);

  // Guard: if any lab value is missing/NaN use a neutral 50 for that param only
  const safe = (v, fallback = 50) => (isNaN(v) || v == null) ? fallback : v;
  const phS = safe(ph, 6.5), ecS = safe(ec, 1.0), ocS = safe(oc, 0.75);
  const nS  = safe(n, 80),   pS  = safe(p, 40),   kS  = safe(k, 150);

  // Per-parameter scores (0–100)
  const scores = {
    ph: scoreParam(phS, 6.0, 7.5, 4.5, 9.0),
    ec: scoreParam(ecS, 0.1, 2.0, 0,   8.0),
    oc: scoreParam(ocS, 0.75, 2.0, 0,  4.0),
    n:  scoreParam(nS,  80, 160,   0,  300),
    p:  scoreParam(pS,  30,  80,   0,  150),
    k:  scoreParam(kS, 150, 300,   0,  500),
  };

  // Weights — pH governs nutrient availability so carries highest weight
  const weights = { ph: 0.30, ec: 0.12, oc: 0.18, n: 0.16, p: 0.12, k: 0.12 };
  let labScore = Object.keys(scores).reduce((sum, key) => sum + scores[key] * weights[key], 0);

  // pH hard caps — extreme pH locks nutrients regardless of other values
  if      (phS < 4.5 || phS > 9.0) labScore = Math.min(labScore, 25);
  else if (phS < 5.0 || phS > 8.5) labScore = Math.min(labScore, 38);
  else if (phS < 5.5 || phS > 8.0) labScore = Math.min(labScore, 55);
  else if (phS < 6.0 || phS > 7.5) labScore = Math.min(labScore, 72);

  // EC hard cap — severe salinity kills crops
  if (ecS > 4.0) labScore = Math.min(labScore, 30);

  // Visual bonus from image analysis (0–10 points, scaled to 0–10% of total)
  const vBonus = visualBonus(data);

  // Final score: lab score (90%) + visual bonus (10%), clamped 0–100
  let overall = clamp(labScore * 0.90 + vBonus, 0, 100);

  // Grade thresholds per requirement
  let grade, colour;
  if (overall >= 80)      { grade = 'Excellent'; colour = 'green'; }
  else if (overall >= 60) { grade = 'Good';      colour = 'yellow'; }
  else if (overall >= 40) { grade = 'Average';   colour = 'orange'; }
  else                    { grade = 'Poor';       colour = 'red'; }

  return { overall: Math.round(overall), scores, grade, colour };
}

function getSuitableCrops(data) {
  const { soilPH: ph, nitrogen: n, phosphorus: p, potassium: k, soilType, season } = data;
  const suitable = [];
  const unsuitable = [];

  for (const [crop, req] of Object.entries(CROP_DB)) {
    const phOk     = ph >= req.ph[0] && ph <= req.ph[1];  // hard gate — pH must match
    const seasonOk = req.seasons.includes(season) || req.seasons.includes('Annual'); // hard gate
    const nOk      = n >= req.n[0] * 0.6;
    const pOk      = p >= req.p[0] * 0.6;
    const kOk      = k >= req.k[0] * 0.6;
    const soilOk   = req.soilTypes.some(s => soilType.toLowerCase().includes(s.toLowerCase()));

    // pH and season are mandatory; at least 3 of the remaining 4 must pass
    const nutrientScore = [nOk, pOk, kOk, soilOk].filter(Boolean).length;

    if (phOk && seasonOk && nutrientScore >= 2)
      suitable.push({ crop, score: nutrientScore + 2, waterNeed: req.water, season: req.seasons.join('/') });
    else
      unsuitable.push({ crop, reason: !phOk ? 'pH mismatch' : !seasonOk ? 'Wrong season' : 'Nutrient deficiency' });
  }

  suitable.sort((a, b) => b.score - a.score);
  return { suitable: suitable.slice(0, 5), unsuitable: unsuitable.slice(0, 5) };
}

function getFertilizerRecommendations(data) {
  const { nitrogen: n, phosphorus: p, potassium: k, soilPH: ph, organicCarbon: oc, crop } = data;
  const recs = [];

  // Target nutrient levels based on crop requirements (use crop DB if available, else defaults)
  const cropReq = CROP_DB[crop];
  const nTarget = cropReq ? cropReq.n[0] : 80;   // minimum required N
  const pTarget = cropReq ? cropReq.p[0] : 30;   // minimum required P
  const kTarget = cropReq ? cropReq.k[0] : 150;  // minimum required K

  // Chemical fertilizers — doses based on actual deficiency gap
  // Urea: 46% N → need (deficit / 0.46) kg Urea/ha
  if (n < nTarget)  recs.push({ type: 'Chemical', name: 'Urea (46% N)', dose: `${Math.round((nTarget - n) / 0.46)} kg/ha`, timing: 'Split: 50% basal + 50% top-dress at 30 days', why: `Nitrogen is ${n} kg/ha, crop needs ${nTarget} kg/ha`, benefit: 'Boosts vegetative growth and chlorophyll production' });
  // DAP: 18% N + 46% P₂O₅ (P = P₂O₅ × 0.436) → effective P = 46% × 0.436 = 20% P per kg DAP
  if (p < pTarget)  recs.push({ type: 'Chemical', name: 'DAP (18-46-0)', dose: `${Math.round((pTarget - p) / 0.20)} kg/ha`, timing: 'Apply at sowing as basal dose', why: `Phosphorus is ${p} kg/ha, crop needs ${pTarget} kg/ha`, benefit: 'Improves root development and flowering' });
  // MOP: 60% K₂O (K = K₂O × 0.83) → effective K = 60% × 0.83 = 50% K per kg MOP
  if (k < kTarget) recs.push({ type: 'Chemical', name: 'MOP (60% K₂O)', dose: `${Math.round((kTarget - k) / 0.50)} kg/ha`, timing: 'Apply at sowing as basal dose', why: `Potassium is ${k} kg/ha, crop needs ${kTarget} kg/ha`, benefit: 'Enhances disease resistance and fruit quality' });

  // pH correction
  if (ph < 5.5) recs.push({ type: 'Amendment', name: 'Agricultural Lime (CaCO₃)', dose: '2–4 tonnes/ha', timing: '4–6 weeks before sowing', why: 'Soil is strongly acidic', benefit: 'Raises pH, improves nutrient availability' });
  if (ph > 8.0) recs.push({ type: 'Amendment', name: 'Gypsum (CaSO₄)', dose: '1–2 tonnes/ha', timing: 'Before land preparation', why: 'Soil is alkaline', benefit: 'Lowers pH, improves soil structure' });

  // Organic
  if (oc < 0.75) recs.push({ type: 'Organic', name: 'FYM (Farm Yard Manure)', dose: '10–15 tonnes/ha', timing: '3–4 weeks before sowing', why: 'Low organic carbon', benefit: 'Improves soil structure, water retention, and microbial activity' });

  // Biofertilizers
  const bio = [];
  bio.push({ name: 'Rhizobium', dose: '200 g/10 kg seed', benefit: 'Fixes atmospheric nitrogen, reduces urea requirement by 25%' });
  bio.push({ name: 'PSB (Phosphate Solubilising Bacteria)', dose: '200 g/10 kg seed', benefit: 'Solubilises fixed phosphorus, improves P availability by 30%' });
  bio.push({ name: 'Azospirillum', dose: '200 g/10 kg seed', benefit: 'Promotes root growth and nitrogen fixation' });
  if (oc < 1.0) bio.push({ name: 'Trichoderma viride', dose: '2.5 kg/ha mixed with FYM', benefit: 'Improves organic matter decomposition and controls soil-borne diseases' });

  // Micronutrients
  const micro = [];
  if (ph > 7.5) micro.push({ name: 'Zinc Sulphate', dose: '25 kg/ha', timing: 'Basal application', why: 'Alkaline soils lock zinc' });
  if (ph < 6.0) micro.push({ name: 'Borax', dose: '10 kg/ha', timing: 'Basal application', why: 'Acidic soils may be boron deficient' });
  micro.push({ name: 'Ferrous Sulphate', dose: '25 kg/ha', timing: 'Foliar spray 0.5% solution', why: 'Iron deficiency common in alkaline soils' });

  return { chemical: recs.filter(r => r.type === 'Chemical'), amendments: recs.filter(r => r.type === 'Amendment'), organic: recs.filter(r => r.type === 'Organic'), biofertilizers: bio, micronutrients: micro };
}

function getIrrigationAnalysis(data) {
  const { irrigationType, soilType, crop, rainfall, humidity, temperature } = data;
  const waterStress = rainfall < 500 && humidity < 50;
  const cropWater = CROP_DB[crop]?.water || 'Medium';

  const waterReq = cropWater === 'High' ? '800–1200 mm/season' : cropWater === 'Medium' ? '400–700 mm/season' : '200–400 mm/season';

  const bestMethod = soilType.toLowerCase().includes('sandy') ? 'Drip Irrigation' :
                     soilType.toLowerCase().includes('clay') ? 'Furrow Irrigation' : 'Sprinkler Irrigation';

  return {
    currentMethod: irrigationType,
    recommendedMethod: bestMethod,
    waterRequirement: waterReq,
    waterStressRisk: waterStress ? 'High' : 'Low',
    schedule: cropWater === 'High' ? 'Every 5–7 days' : cropWater === 'Medium' ? 'Every 10–12 days' : 'Every 15–20 days',
    tips: [
      'Irrigate in early morning or evening to reduce evaporation',
      'Use soil moisture sensors for precision irrigation',
      waterStress ? 'Install mulching to conserve soil moisture' : 'Current rainfall is adequate — monitor soil moisture',
    ]
  };
}

function getYieldPrediction(data, healthScore) {
  // National average yields (tonnes/ha) — ICAR / FAOSTAT India references
  const baseYields = {
    Rice: 2.6, Wheat: 3.5, Maize: 3.0, Cotton: 0.5, Sugarcane: 70, Soybean: 1.2,
    Groundnut: 1.4, Tomato: 20, Onion: 16, Chickpea: 1.0, Mustard: 1.1, Sunflower: 0.9,
    Turmeric: 6.0, Banana: 25, Mango: 8
  };
  // Attainable yield under good management (progressive farmer benchmark)
  const attainableYields = {
    Rice: 5.5, Wheat: 5.0, Maize: 6.0, Cotton: 1.8, Sugarcane: 100, Soybean: 2.5,
    Groundnut: 2.5, Tomato: 35, Onion: 25, Chickpea: 1.8, Mustard: 1.8, Sunflower: 1.8,
    Turmeric: 10, Banana: 40, Mango: 12
  };

  const base       = baseYields[data.crop]      || 2.0;
  const attainable = attainableYields[data.crop] || 4.0;
  const score      = healthScore.overall / 100;  // 0–1

  // Predicted = base + (attainable - base) × health_score
  // At score=0 → base yield (national avg), at score=1 → attainable yield
  const predicted = parseFloat((base + (attainable - base) * score).toFixed(1));
  const gap       = parseFloat((attainable - predicted).toFixed(1));

  return {
    predicted: `${predicted} tonnes/ha`,
    potential: `${attainable} tonnes/ha`,
    gap: `${gap} tonnes/ha`,
    improvementPotential: `${Math.round((gap / attainable) * 100)}%`,
    factors: healthScore.overall < 60
      ? ['Below-average soil health', 'Nutrient imbalance', 'Suboptimal pH']
      : ['Good soil health', 'Adequate nutrients', 'Favourable conditions']
  };
}

function getActionPlan(data, nutrientAnalysis, healthScore) {
  const { issues } = nutrientAnalysis;
  const immediate = [];
  const weekly = [];
  const monthly = [];
  const seasonal = [];
  const longTerm = [];

  // Immediate
  if (issues.some(i => i.severity === 'critical')) immediate.push('Apply emergency nutrient correction as per fertilizer recommendations');
  if (data.soilPH < 5.5) immediate.push('Apply agricultural lime immediately to correct severe acidity');
  if (data.electricalConductivity > 4.0) immediate.push('Flush soil with excess water to leach salts before sowing');
  immediate.push('Conduct seed treatment with biofertilizers before sowing');
  immediate.push('Prepare land with deep ploughing to improve aeration');

  // Weekly
  weekly.push('Monitor soil moisture and adjust irrigation schedule');
  weekly.push('Inspect crop for early signs of nutrient deficiency (yellowing, stunting)');
  weekly.push('Check for pest and disease incidence');

  // Monthly
  monthly.push('Apply top-dress nitrogen fertilizer at 30 days after sowing');
  monthly.push('Conduct foliar spray of micronutrients if deficiency symptoms appear');
  monthly.push('Update farm diary with observations');

  // Seasonal
  seasonal.push('Conduct soil testing at end of season to track improvement');
  seasonal.push('Apply FYM/compost before next crop season');
  seasonal.push('Plan crop rotation to break pest cycles and improve soil health');
  if (data.organicCarbon < 0.75) seasonal.push('Incorporate crop residues into soil after harvest');

  // Long-term
  longTerm.push('Adopt integrated nutrient management (INM) combining organic and chemical fertilizers');
  longTerm.push('Install drip irrigation for water use efficiency');
  longTerm.push('Plant green manure crops (Dhaincha/Sunhemp) in fallow period');
  longTerm.push('Build soil organic matter to above 1.5% over 3–5 years');
  if (healthScore.overall < 50) longTerm.push('Consider soil reclamation programme with government support');

  return { immediate, weekly, monthly, seasonal, longTerm };
}

function getNotifications(data, nutrientAnalysis, healthScore) {
  const alerts = [];
  const { issues } = nutrientAnalysis;

  issues.forEach(issue => {
    alerts.push({
      type: issue.severity === 'critical' ? 'error' : 'warning',
      title: `${issue.param} ${issue.level}`,
      message: `${issue.param} is ${issue.level} at ${issue.value} ${issue.unit}. Immediate attention required.`,
      icon: issue.param === 'Soil pH' ? '⚗️' : issue.param.includes('Nitrogen') ? '🌿' : '⚠️'
    });
  });

  if (healthScore.overall >= 75) alerts.push({ type: 'success', title: 'Excellent Soil Quality', message: 'Your soil is in excellent condition for farming!', icon: '🌟' });
  if (data.electricalConductivity > 2.0) alerts.push({ type: 'warning', title: 'Salinity Risk', message: 'High EC detected. Monitor salt accumulation.', icon: '🧂' });
  if (data.organicCarbon < 0.5) alerts.push({ type: 'error', title: 'Organic Carbon Critical', message: 'Very low organic carbon. Soil health is at risk.', icon: '🌱' });

  return alerts;
}

function getRiskAnalysis(data, healthScore) {
  const risks = [];

  if (data.soilPH < 5.5 || data.soilPH > 8.5) risks.push({ risk: 'Nutrient Lockout', severity: 'High', description: 'Extreme pH prevents nutrient uptake even when nutrients are present', mitigation: 'Correct pH before applying fertilizers' });
  if (data.electricalConductivity > 2.0) risks.push({ risk: 'Soil Salinity', severity: 'High', description: 'High salt concentration causes osmotic stress in plants', mitigation: 'Leach salts with excess irrigation, use salt-tolerant varieties' });
  if (data.organicCarbon < 0.5) risks.push({ risk: 'Soil Degradation', severity: 'Medium', description: 'Very low organic matter leads to poor soil structure and water retention', mitigation: 'Add FYM, compost, and green manures regularly' });
  if (data.rainfall < 300 && data.irrigationType === 'Rainfed') risks.push({ risk: 'Drought Stress', severity: 'High', description: 'Insufficient rainfall with no irrigation backup', mitigation: 'Install irrigation system or choose drought-tolerant crops' });
  if (healthScore.overall < 40) risks.push({ risk: 'Crop Failure Risk', severity: 'High', description: 'Poor soil health significantly increases crop failure probability', mitigation: 'Implement comprehensive soil improvement plan before sowing' });

  return risks;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
function runSoilAnalysis(data) {
  const healthScore    = calculateHealthScore(data);
  const nutrientAnalysis = analyseNutrients(data);
  const cropSuitability  = getSuitableCrops(data);
  const fertilizers      = getFertilizerRecommendations(data);
  const irrigation       = getIrrigationAnalysis(data);
  const yieldPrediction  = getYieldPrediction(data, healthScore);
  const actionPlan       = getActionPlan(data, nutrientAnalysis, healthScore);
  const notifications    = getNotifications(data, nutrientAnalysis, healthScore);
  const risks            = getRiskAnalysis(data, healthScore);

  const soilFertility = healthScore.scores.n > 70 && healthScore.scores.p > 70 && healthScore.scores.k > 70 ? 'High' : healthScore.scores.n > 40 ? 'Medium' : 'Low';
  const organicSuitability = data.organicCarbon >= 0.75 && data.electricalConductivity < 2.0 ? 'Suitable' : 'Needs Improvement';

  return {
    healthScore,
    nutrientAnalysis,
    cropSuitability,
    fertilizers,
    irrigation,
    yieldPrediction,
    actionPlan,
    notifications,
    risks,
    summary: {
      soilFertility,
      soilHealth: healthScore.grade,
      organicFarmingSuitability: organicSuitability,
      waterRetention: ['Clay', 'Black', 'Clay Loam'].some(t => data.soilType.includes(t)) ? 'High' : 'Medium',
      bestSeason: cropSuitability.suitable[0]?.season || data.season,
    },
    agentMetadata: {
      agentId: 'soil-intelligence-agent-v1',
      analysedAt: new Date().toISOString(),
      version: '1.0.0',
      readyForMultiAgent: true,
    }
  };
}

module.exports = { runSoilAnalysis };
