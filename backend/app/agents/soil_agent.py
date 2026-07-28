"""
Soil Intelligence AI Engine — adapted for image-based parameter estimation.
Uses estimated values from image analysis instead of manual inputs.
"""
from datetime import datetime, timezone

CROP_DB = {
    "Rice":      {"ph": [5.5, 7.0], "n": [80, 120],  "p": [40, 60],  "k": [40, 60],   "seasons": ["Kharif"],          "water": "High",   "soilTypes": ["Clay", "Loamy"]},
    "Wheat":     {"ph": [6.0, 7.5], "n": [100, 150], "p": [50, 70],  "k": [40, 60],   "seasons": ["Rabi"],            "water": "Medium", "soilTypes": ["Loamy", "Sandy Loam"]},
    "Maize":     {"ph": [5.8, 7.0], "n": [100, 140], "p": [50, 70],  "k": [50, 70],   "seasons": ["Kharif", "Rabi"],  "water": "Medium", "soilTypes": ["Loamy", "Sandy Loam", "Clay Loam"]},
    "Cotton":    {"ph": [6.0, 8.0], "n": [80, 120],  "p": [40, 60],  "k": [40, 60],   "seasons": ["Kharif"],          "water": "Medium", "soilTypes": ["Black", "Clay Loam"]},
    "Sugarcane": {"ph": [6.0, 7.5], "n": [150, 200], "p": [60, 80],  "k": [80, 100],  "seasons": ["Annual"],          "water": "High",   "soilTypes": ["Loamy", "Clay Loam"]},
    "Soybean":   {"ph": [6.0, 7.0], "n": [20, 40],   "p": [50, 70],  "k": [40, 60],   "seasons": ["Kharif"],          "water": "Medium", "soilTypes": ["Loamy", "Clay Loam"]},
    "Groundnut": {"ph": [5.5, 7.0], "n": [20, 40],   "p": [40, 60],  "k": [40, 60],   "seasons": ["Kharif", "Rabi"],  "water": "Low",    "soilTypes": ["Sandy Loam", "Loamy"]},
    "Tomato":    {"ph": [5.5, 7.0], "n": [100, 150], "p": [60, 80],  "k": [80, 100],  "seasons": ["Rabi", "Summer"],  "water": "Medium", "soilTypes": ["Loamy", "Sandy Loam"]},
    "Onion":     {"ph": [6.0, 7.5], "n": [80, 120],  "p": [50, 70],  "k": [60, 80],   "seasons": ["Rabi"],            "water": "Medium", "soilTypes": ["Loamy", "Sandy Loam"]},
    "Chickpea":  {"ph": [6.0, 8.0], "n": [20, 40],   "p": [40, 60],  "k": [20, 40],   "seasons": ["Rabi"],            "water": "Low",    "soilTypes": ["Loamy", "Sandy Loam", "Black"]},
    "Mustard":   {"ph": [6.0, 7.5], "n": [60, 100],  "p": [30, 50],  "k": [30, 50],   "seasons": ["Rabi"],            "water": "Low",    "soilTypes": ["Loamy", "Sandy Loam"]},
    "Sunflower": {"ph": [6.0, 7.5], "n": [60, 100],  "p": [40, 60],  "k": [40, 60],   "seasons": ["Kharif", "Rabi"],  "water": "Medium", "soilTypes": ["Loamy", "Sandy Loam"]},
    "Turmeric":  {"ph": [5.5, 7.0], "n": [100, 150], "p": [50, 70],  "k": [80, 100],  "seasons": ["Kharif"],          "water": "High",   "soilTypes": ["Loamy", "Clay Loam"]},
    "Banana":    {"ph": [6.0, 7.5], "n": [150, 200], "p": [60, 80],  "k": [150, 200], "seasons": ["Annual"],          "water": "High",   "soilTypes": ["Loamy", "Clay Loam"]},
    "Mango":     {"ph": [5.5, 7.5], "n": [80, 120],  "p": [40, 60],  "k": [60, 80],   "seasons": ["Annual"],          "water": "Low",    "soilTypes": ["Loamy", "Sandy Loam", "Red"]},
}

BASE_YIELDS = {
    "Rice": 2.6, "Wheat": 3.5, "Maize": 3.0, "Cotton": 0.5, "Sugarcane": 70,
    "Soybean": 1.2, "Groundnut": 1.4, "Tomato": 20, "Onion": 16, "Chickpea": 1.0,
    "Mustard": 1.1, "Sunflower": 0.9, "Turmeric": 6.0, "Banana": 25, "Mango": 8,
}
ATTAINABLE_YIELDS = {
    "Rice": 5.5, "Wheat": 5.0, "Maize": 6.0, "Cotton": 1.8, "Sugarcane": 100,
    "Soybean": 2.5, "Groundnut": 2.5, "Tomato": 35, "Onion": 25, "Chickpea": 1.8,
    "Mustard": 1.8, "Sunflower": 1.8, "Turmeric": 10, "Banana": 40, "Mango": 12,
}


def _clamp(val, lo, hi):
    return max(lo, min(hi, val))


def _score_param(value, ideal_min, ideal_max, hard_min, hard_max):
    if ideal_min <= value <= ideal_max:
        return 100.0
    if value < ideal_min:
        return _clamp(((value - hard_min) / (ideal_min - hard_min)) * 100, 0, 100)
    return _clamp(((hard_max - value) / (hard_max - ideal_max)) * 100, 0, 100)


def _normalise(data: dict) -> dict:
    """Map manual form field names to engine-compatible keys, preserving visual fields."""
    return {
        "soilPH":                 float(data.get("soilPH", 6.5)),
        "electricalConductivity": float(data.get("electricalConductivity", 1.0)),
        "organicCarbon":          float(data.get("organicCarbon", 0.75)),
        "nitrogen":               float(data.get("nitrogen", 80.0)),
        "phosphorus":             float(data.get("phosphorus", 40.0)),
        "potassium":              float(data.get("potassium", 150.0)),
        "soilType":               data.get("soilType", "Loamy"),
        "soilColour":             data.get("soilColour", "Brown"),
        "season":                 data.get("season", "Kharif"),
        "crop":                   data.get("crop", "Wheat"),
        "irrigationType":         data.get("irrigationType", "Drip"),
        "farmSize":               float(data.get("farmSize", 1.0)),
        # Visual fields from image analysis — used in health score bonus
        "moisture":               data.get("moisture", ""),
        "organicMatter":          data.get("organicMatter", ""),
        "texture":                data.get("texture", ""),
    }


def analyse_nutrients(data: dict) -> dict:
    n, p, k = data["nitrogen"], data["phosphorus"], data["potassium"]
    ph, ec, oc = data["soilPH"], data["electricalConductivity"], data["organicCarbon"]
    issues, strengths = [], []

    if n < 40:      issues.append({"param": "Nitrogen", "level": "Very Low", "severity": "critical", "value": n, "unit": "kg/ha"})
    elif n < 80:    issues.append({"param": "Nitrogen", "level": "Low",      "severity": "warning",  "value": n, "unit": "kg/ha"})
    elif n > 200:   issues.append({"param": "Nitrogen", "level": "Excess",   "severity": "warning",  "value": n, "unit": "kg/ha"})
    else:           strengths.append({"param": "Nitrogen", "level": "Optimal", "value": n, "unit": "kg/ha"})

    if p < 15:      issues.append({"param": "Phosphorus", "level": "Very Low", "severity": "critical", "value": p, "unit": "kg/ha"})
    elif p < 30:    issues.append({"param": "Phosphorus", "level": "Low",      "severity": "warning",  "value": p, "unit": "kg/ha"})
    elif p > 100:   issues.append({"param": "Phosphorus", "level": "Excess",   "severity": "warning",  "value": p, "unit": "kg/ha"})
    else:           strengths.append({"param": "Phosphorus", "level": "Optimal", "value": p, "unit": "kg/ha"})

    if k < 100:     issues.append({"param": "Potassium", "level": "Very Low", "severity": "critical", "value": k, "unit": "kg/ha"})
    elif k < 150:   issues.append({"param": "Potassium", "level": "Low",      "severity": "warning",  "value": k, "unit": "kg/ha"})
    elif k > 400:   issues.append({"param": "Potassium", "level": "Excess",   "severity": "warning",  "value": k, "unit": "kg/ha"})
    else:           strengths.append({"param": "Potassium", "level": "Optimal", "value": k, "unit": "kg/ha"})

    if ph < 5.5:    issues.append({"param": "Soil pH", "level": "Strongly Acidic",     "severity": "critical", "value": ph, "unit": ""})
    elif ph < 6.0:  issues.append({"param": "Soil pH", "level": "Moderately Acidic",   "severity": "warning",  "value": ph, "unit": ""})
    elif ph > 8.5:  issues.append({"param": "Soil pH", "level": "Strongly Alkaline",   "severity": "critical", "value": ph, "unit": ""})
    elif ph > 7.5:  issues.append({"param": "Soil pH", "level": "Moderately Alkaline", "severity": "warning",  "value": ph, "unit": ""})
    else:           strengths.append({"param": "Soil pH", "level": "Optimal", "value": ph, "unit": ""})

    if ec > 4.0:    issues.append({"param": "Electrical Conductivity", "level": "Very High (Saline)", "severity": "critical", "value": ec, "unit": "dS/m"})
    elif ec > 2.0:  issues.append({"param": "Electrical Conductivity", "level": "High",               "severity": "warning",  "value": ec, "unit": "dS/m"})
    else:           strengths.append({"param": "Electrical Conductivity", "level": "Normal", "value": ec, "unit": "dS/m"})

    if oc < 0.5:    issues.append({"param": "Organic Carbon", "level": "Very Low",          "severity": "critical", "value": oc, "unit": "%"})
    elif oc < 0.75: issues.append({"param": "Organic Carbon", "level": "Low",               "severity": "warning",  "value": oc, "unit": "%"})
    elif oc > 2.0:  strengths.append({"param": "Organic Carbon", "level": "High (Excellent)", "value": oc, "unit": "%"})
    else:           strengths.append({"param": "Organic Carbon", "level": "Adequate",          "value": oc, "unit": "%"})

    return {"issues": issues, "strengths": strengths}


def _visual_bonus(data: dict) -> float:
    """
    Image-detected visual properties contribute up to 10 bonus points.
    Moisture, organic matter, texture, and soil type each have weighted scores.
    """
    moisture_score  = {"Wet": 3, "Moist": 7, "Moderate": 10, "Dry": 4}
    om_score        = {"High": 10, "Moderate": 7, "Low": 3}
    texture_score   = {"Fine": 7, "Medium": 10, "Coarse": 5, "Gritty": 4, "Silty": 8, "Clayey": 6}
    soil_type_score = {
        "Black Cotton": 10, "Alluvial": 9, "Clay Loam": 8, "Loamy": 8,
        "Clay": 7, "Sandy Loam": 6, "Red": 5, "Laterite": 4, "Sandy": 3,
    }

    bonus  = moisture_score.get(data.get("moisture", ""), 5) * 0.30
    bonus += om_score.get(data.get("organicMatter", ""), 5) * 0.35
    bonus += texture_score.get(data.get("texture", ""), 5) * 0.20

    st = data.get("soilType", "")
    st_key = next((k for k in soil_type_score if k.lower() in st.lower()), None)
    bonus += soil_type_score.get(st_key, 5) * 0.15

    return bonus  # 0–10 range


def calculate_health_score(data: dict) -> dict:
    ph  = float(data.get("soilPH", 6.5))
    ec  = float(data.get("electricalConductivity", 1.0))
    oc  = float(data.get("organicCarbon", 0.75))
    n   = float(data.get("nitrogen", 80.0))
    p   = float(data.get("phosphorus", 40.0))
    k   = float(data.get("potassium", 150.0))

    # Per-parameter scores (0–100)
    scores = {
        "ph": _score_param(ph, 6.0, 7.5, 4.5, 9.0),
        "ec": _score_param(ec, 0.1, 2.0, 0.0, 8.0),
        "oc": _score_param(oc, 0.75, 2.0, 0.0, 4.0),
        "n":  _score_param(n,  80,  160,  0.0, 300.0),
        "p":  _score_param(p,  30,   80,  0.0, 150.0),
        "k":  _score_param(k, 150,  300,  0.0, 500.0),
    }

    # Weights — pH governs nutrient availability so carries highest weight
    weights = {"ph": 0.30, "ec": 0.12, "oc": 0.18, "n": 0.16, "p": 0.12, "k": 0.12}
    lab_score = sum(scores[key] * weights[key] for key in scores)

    # pH hard caps — extreme pH locks nutrients regardless of other values
    if   ph < 4.5 or ph > 9.0:  lab_score = min(lab_score, 25)
    elif ph < 5.0 or ph > 8.5:  lab_score = min(lab_score, 38)
    elif ph < 5.5 or ph > 8.0:  lab_score = min(lab_score, 55)
    elif ph < 6.0 or ph > 7.5:  lab_score = min(lab_score, 72)

    # EC hard cap — severe salinity kills crops
    if ec > 4.0: lab_score = min(lab_score, 30)

    # Visual bonus from image analysis (0–10 points)
    v_bonus = _visual_bonus(data)

    # Final score: lab score (90%) + visual bonus (10%), clamped 0–100
    overall = _clamp(lab_score * 0.90 + v_bonus, 0, 100)

    # Grade thresholds per requirement
    if   overall >= 80: grade, colour = "Excellent", "green"
    elif overall >= 60: grade, colour = "Good",      "yellow"
    elif overall >= 40: grade, colour = "Average",   "orange"
    else:               grade, colour = "Poor",      "red"

    return {"overall": round(overall), "scores": scores, "grade": grade, "colour": colour}


def get_suitable_crops(data: dict) -> dict:
    ph, n, p, k = data["soilPH"], data["nitrogen"], data["phosphorus"], data["potassium"]
    soil_type, season = data["soilType"], data["season"]
    suitable, unsuitable = [], []

    for crop, req in CROP_DB.items():
        ph_ok     = req["ph"][0] <= ph <= req["ph"][1]   # hard gate
        season_ok = season in req["seasons"] or "Annual" in req["seasons"]  # hard gate
        n_ok      = n >= req["n"][0] * 0.6
        p_ok      = p >= req["p"][0] * 0.6
        k_ok      = k >= req["k"][0] * 0.6
        soil_ok   = any(s.lower() in soil_type.lower() for s in req["soilTypes"])

        nutrient_score = sum([n_ok, p_ok, k_ok, soil_ok])
        if ph_ok and season_ok and nutrient_score >= 2:
            suitable.append({"crop": crop, "score": nutrient_score + 2, "waterNeed": req["water"], "season": "/".join(req["seasons"])})
        else:
            reason = "pH mismatch" if not ph_ok else "Wrong season" if not season_ok else "Nutrient deficiency"
            unsuitable.append({"crop": crop, "reason": reason})

    suitable.sort(key=lambda x: x["score"], reverse=True)
    return {"suitable": suitable[:5], "unsuitable": unsuitable[:5]}


def get_fertilizer_recommendations(data: dict) -> dict:
    n, p, k = data["nitrogen"], data["phosphorus"], data["potassium"]
    ph, oc  = data["soilPH"], data["organicCarbon"]
    crop    = data.get("crop", "Wheat")
    recs    = []

    # Crop-specific nutrient targets (minimum required)
    req       = CROP_DB.get(crop, {})
    n_target  = req.get("n", [80, 120])[0]
    p_target  = req.get("p", [30, 60])[0]
    k_target  = req.get("k", [150, 200])[0]

    # Urea: 46% N  → kg Urea = deficit / 0.46
    if n < n_target:  recs.append({"type": "Chemical", "name": "Urea (46% N)",   "dose": f"{round((n_target - n) / 0.46)} kg/ha",  "timing": "Split: 50% basal + 50% top-dress at 30 days", "why": f"Nitrogen is {n} kg/ha, crop needs {n_target} kg/ha",   "benefit": "Boosts vegetative growth and chlorophyll production"})
    # DAP: effective P ≈ 20% per kg  → kg DAP = deficit / 0.20
    if p < p_target:  recs.append({"type": "Chemical", "name": "DAP (18-46-0)",  "dose": f"{round((p_target - p) / 0.20)} kg/ha",  "timing": "Apply at sowing as basal dose",               "why": f"Phosphorus is {p} kg/ha, crop needs {p_target} kg/ha", "benefit": "Improves root development and flowering"})
    # MOP: effective K ≈ 50% per kg  → kg MOP = deficit / 0.50
    if k < k_target: recs.append({"type": "Chemical", "name": "MOP (60% K₂O)", "dose": f"{round((k_target - k) / 0.50)} kg/ha", "timing": "Apply at sowing as basal dose",               "why": f"Potassium is {k} kg/ha, crop needs {k_target} kg/ha",  "benefit": "Enhances disease resistance and fruit quality"})

    if ph < 5.5: recs.append({"type": "Amendment", "name": "Agricultural Lime (CaCO₃)", "dose": "2–4 tonnes/ha", "timing": "4–6 weeks before sowing",  "why": "Soil is strongly acidic", "benefit": "Raises pH, improves nutrient availability"})
    if ph > 8.0: recs.append({"type": "Amendment", "name": "Gypsum (CaSO₄)",            "dose": "1–2 tonnes/ha", "timing": "Before land preparation",   "why": "Soil is alkaline",        "benefit": "Lowers pH, improves soil structure"})

    if oc < 0.75: recs.append({"type": "Organic", "name": "FYM (Farm Yard Manure)", "dose": "10–15 tonnes/ha", "timing": "3–4 weeks before sowing", "why": "Low organic carbon", "benefit": "Improves soil structure, water retention, and microbial activity"})

    bio = [
        {"name": "Rhizobium",                             "dose": "200 g/10 kg seed",        "benefit": "Fixes atmospheric nitrogen, reduces urea requirement by 25%"},
        {"name": "PSB (Phosphate Solubilising Bacteria)", "dose": "200 g/10 kg seed",        "benefit": "Solubilises fixed phosphorus, improves P availability by 30%"},
        {"name": "Azospirillum",                          "dose": "200 g/10 kg seed",        "benefit": "Promotes root growth and nitrogen fixation"},
    ]
    if oc < 1.0:
        bio.append({"name": "Trichoderma viride", "dose": "2.5 kg/ha mixed with FYM", "benefit": "Improves organic matter decomposition and controls soil-borne diseases"})

    micro = []
    if ph > 7.5: micro.append({"name": "Zinc Sulphate",  "dose": "25 kg/ha",  "timing": "Basal application",          "why": "Alkaline soils lock zinc"})
    if ph < 6.0: micro.append({"name": "Borax",          "dose": "10 kg/ha",  "timing": "Basal application",          "why": "Acidic soils may be boron deficient"})
    micro.append(         {"name": "Ferrous Sulphate", "dose": "25 kg/ha",  "timing": "Foliar spray 0.5% solution", "why": "Iron deficiency common in alkaline soils"})

    return {
        "chemical":       [r for r in recs if r["type"] == "Chemical"],
        "amendments":     [r for r in recs if r["type"] == "Amendment"],
        "organic":        [r for r in recs if r["type"] == "Organic"],
        "biofertilizers": bio,
        "micronutrients": micro,
    }


def get_irrigation_analysis(data: dict) -> dict:
    irrigation_type = data.get("irrigationType", "Drip")
    soil_type       = data.get("soilType", "Loamy")
    crop            = data.get("crop", "Wheat")
    moisture        = data.get("moistureLevel", "Medium")

    crop_water = CROP_DB.get(crop, {}).get("water", "Medium")
    water_req  = {"High": "800–1200 mm/season", "Medium": "400–700 mm/season", "Low": "200–400 mm/season"}[crop_water]

    if "sandy" in soil_type.lower():  best_method = "Drip Irrigation"
    elif "clay" in soil_type.lower(): best_method = "Furrow Irrigation"
    else:                             best_method = "Sprinkler Irrigation"

    schedule = {"High": "Every 5–7 days", "Medium": "Every 10–12 days", "Low": "Every 15–20 days"}[crop_water]
    water_stress = moisture == "Low"

    return {
        "currentMethod":     irrigation_type,
        "recommendedMethod": best_method,
        "waterRequirement":  water_req,
        "waterStressRisk":   "High" if water_stress else "Low",
        "schedule":          schedule,
        "tips": [
            "Irrigate in early morning or evening to reduce evaporation",
            "Use soil moisture sensors for precision irrigation",
            "Install mulching to conserve soil moisture" if water_stress else "Monitor soil moisture regularly",
        ],
    }


def get_yield_prediction(data: dict, health_score: dict) -> dict:
    crop       = data.get("crop", "Wheat")
    base       = BASE_YIELDS.get(crop, 2.0)
    attainable = ATTAINABLE_YIELDS.get(crop, 4.0)
    score      = health_score["overall"] / 100  # 0–1

    # predicted = base + (attainable - base) × health_score
    predicted = round(base + (attainable - base) * score, 1)
    gap       = round(attainable - predicted, 1)

    return {
        "predicted":            f"{predicted} tonnes/ha",
        "potential":            f"{attainable} tonnes/ha",
        "gap":                  f"{gap} tonnes/ha",
        "improvementPotential": f"{round((gap / attainable) * 100)}%",
        "factors": ["Below-average soil health", "Nutrient imbalance"] if health_score["overall"] < 60 else ["Good soil health", "Adequate nutrients"],
    }


def get_action_plan(data: dict, nutrient_analysis: dict, health_score: dict) -> dict:
    issues = nutrient_analysis["issues"]
    immediate, weekly, monthly, seasonal, long_term = [], [], [], [], []

    if any(i["severity"] == "critical" for i in issues): immediate.append("Apply emergency nutrient correction as per fertilizer recommendations")
    if data["soilPH"] < 5.5:                             immediate.append("Apply agricultural lime immediately to correct severe acidity")
    if data["electricalConductivity"] > 4.0:             immediate.append("Flush soil with excess water to leach salts before sowing")
    immediate += ["Conduct seed treatment with biofertilizers before sowing", "Prepare land with deep ploughing to improve aeration"]

    weekly  += ["Monitor soil moisture and adjust irrigation schedule", "Inspect crop for early signs of nutrient deficiency", "Check for pest and disease incidence"]
    monthly += ["Apply top-dress nitrogen fertilizer at 30 days after sowing", "Conduct foliar spray of micronutrients if deficiency symptoms appear"]
    seasonal += ["Conduct soil testing at end of season to track improvement", "Apply FYM/compost before next crop season", "Plan crop rotation to break pest cycles"]
    if data["organicCarbon"] < 0.75: seasonal.append("Incorporate crop residues into soil after harvest")

    long_term += [
        "Adopt integrated nutrient management (INM) combining organic and chemical fertilizers",
        "Install drip irrigation for water use efficiency",
        "Plant green manure crops (Dhaincha/Sunhemp) in fallow period",
        "Build soil organic matter to above 1.5% over 3–5 years",
    ]
    if health_score["overall"] < 50: long_term.append("Consider soil reclamation programme with government support")

    return {"immediate": immediate, "weekly": weekly, "monthly": monthly, "seasonal": seasonal, "longTerm": long_term}


def get_notifications(data: dict, nutrient_analysis: dict, health_score: dict) -> list:
    alerts = []
    for issue in nutrient_analysis["issues"]:
        alerts.append({
            "type":    "error" if issue["severity"] == "critical" else "warning",
            "title":   f"{issue['param']} {issue['level']}",
            "message": f"{issue['param']} is {issue['level']} at {issue['value']} {issue['unit']}. Immediate attention required.",
            "icon":    "⚗️" if issue["param"] == "Soil pH" else "🌿" if "Nitrogen" in issue["param"] else "⚠️",
        })
    if health_score["overall"] >= 75:         alerts.append({"type": "success", "title": "Excellent Soil Quality",  "message": "Your soil is in excellent condition for farming!", "icon": "🌟"})
    if data["electricalConductivity"] > 2.0:  alerts.append({"type": "warning", "title": "Salinity Risk",           "message": "High EC detected. Monitor salt accumulation.",     "icon": "🧂"})
    if data["organicCarbon"] < 0.5:           alerts.append({"type": "error",   "title": "Organic Carbon Critical", "message": "Very low organic carbon. Soil health is at risk.", "icon": "🌱"})
    return alerts


def get_risk_analysis(data: dict, health_score: dict) -> list:
    risks = []
    if data["soilPH"] < 5.5 or data["soilPH"] > 8.5:
        risks.append({"risk": "Nutrient Lockout", "severity": "High", "description": "Extreme pH prevents nutrient uptake even when nutrients are present", "mitigation": "Correct pH before applying fertilizers"})
    if data["electricalConductivity"] > 2.0:
        risks.append({"risk": "Soil Salinity",    "severity": "High", "description": "High salt concentration causes osmotic stress in plants",             "mitigation": "Leach salts with excess irrigation, use salt-tolerant varieties"})
    if data["organicCarbon"] < 0.5:
        risks.append({"risk": "Soil Degradation", "severity": "Medium", "description": "Very low organic matter leads to poor soil structure and water retention", "mitigation": "Add FYM, compost, and green manures regularly"})
    if health_score["overall"] < 40:
        risks.append({"risk": "Crop Failure Risk", "severity": "High", "description": "Poor soil health significantly increases crop failure probability", "mitigation": "Implement comprehensive soil improvement plan before sowing"})
    return risks


def run_soil_analysis(soil_data: dict, context: dict = None) -> dict:
    """
    Main entry point — accepts manual soil input dict.
    context: optional extra fields to merge.
    """
    if context:
        soil_data = {**soil_data, **context}

    data = _normalise(soil_data)
    data["moistureLevel"] = soil_data.get("moistureLevel", "Moderate")
    # Ensure visual fields from imageAnalysis are available for health score bonus
    if not data["moisture"] and soil_data.get("imageAnalysis"):
        ia = soil_data["imageAnalysis"]
        data["moisture"]      = ia.get("moisture", "")
        data["organicMatter"] = ia.get("organicMatter", "")
        data["texture"]       = ia.get("texture", "")

    health_score      = calculate_health_score(data)
    nutrient_analysis = analyse_nutrients(data)
    crop_suitability  = get_suitable_crops(data)
    fertilizers       = get_fertilizer_recommendations(data)
    irrigation        = get_irrigation_analysis(data)
    yield_prediction  = get_yield_prediction(data, health_score)
    action_plan       = get_action_plan(data, nutrient_analysis, health_score)
    notifications     = get_notifications(data, nutrient_analysis, health_score)
    risks             = get_risk_analysis(data, health_score)

    s = health_score["scores"]
    soil_fertility      = "High" if s["n"] > 70 and s["p"] > 70 and s["k"] > 70 else "Medium" if s["n"] > 40 else "Low"
    organic_suitability = "Suitable" if data["organicCarbon"] >= 0.75 and data["electricalConductivity"] < 2.0 else "Needs Improvement"
    high_retention      = any(t in data["soilType"] for t in ["Clay", "Black", "Clay Loam"])

    return {
        "healthScore":      health_score,
        "nutrientAnalysis": nutrient_analysis,
        "cropSuitability":  crop_suitability,
        "fertilizers":      fertilizers,
        "irrigation":       irrigation,
        "yieldPrediction":  yield_prediction,
        "actionPlan":       action_plan,
        "notifications":    notifications,
        "risks":            risks,
        "estimatedParams":  {
            "soilPH": data["soilPH"],
            "electricalConductivity": data["electricalConductivity"],
            "organicCarbon": data["organicCarbon"],
            "nitrogen": data["nitrogen"],
            "phosphorus": data["phosphorus"],
            "potassium": data["potassium"],
        },
        "summary": {
            "soilFertility":             soil_fertility,
            "soilHealth":                health_score["grade"],
            "organicFarmingSuitability": organic_suitability,
            "waterRetention":            "High" if high_retention else "Medium",
            "bestSeason":                crop_suitability["suitable"][0]["season"] if crop_suitability["suitable"] else data["season"],
        },
        "agentMetadata": {
            "agentId":            "soil-intelligence-agent-v2",
            "analysedAt":         datetime.now(timezone.utc).isoformat(),
            "version":            "2.0.0",
            "analysisMethod":     "image-based",
            "readyForMultiAgent": True,
        },
    }
