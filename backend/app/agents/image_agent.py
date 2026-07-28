"""
Soil Image Analysis Agent — 5-stage pipeline
Stage 1: Validate        — OpenCV + Groq Vision reject non-soil images
Stage 2: CV Analysis     — OpenCV extracts objective pixel measurements
Stage 3: AI Estimation   — Groq Vision classifies soil features from image
Stage 4: Parameter Est.  — Deterministic soil science lookup from CV+AI features
Stage 5: Merge           — Combine all into structured output for rule engine
"""
import cv2
import json
import logging
import base64
import re
import numpy as np
from pathlib import Path

import httpx
from app.config import settings

logger = logging.getLogger(__name__)

GROQ_API_URL  = "https://api.groq.com/openai/v1/chat/completions"
VISION_MODEL  = "meta-llama/llama-4-maverick-17b-128e-instruct"
HAS_VISION    = False  # Groq vision models unavailable — CV-only mode
MIN_CONFIDENCE = 30


# ── Helpers ────────────────────────────────────────────────────────────────────

def _to_base64(image_path: str) -> tuple[str, str]:
    ext  = Path(image_path).suffix.lower().lstrip(".")
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg",
            "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode(), mime


def _parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


# ── Stage 1: Validate with Groq Vision ────────────────────────────────────────

async def _validate(b64: str, mime: str, api_key: str) -> dict:
    payload = {
        "model": VISION_MODEL,
        "messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
            {"type": "text", "text": (
                "You are an agricultural image classifier.\n\n"
                "ACCEPT if the image shows: bare soil, farmland, ploughed land, "
                "soil with crops/plants, mud, dirt, clay, sandy ground, soil samples.\n\n"
                "REJECT only if clearly: screenshot, document, person, vehicle, "
                "building, food, pure sky, pure water — zero soil content.\n\n"
                "When in doubt set isSoil=true.\n\n"
                "Reply ONLY raw JSON:\n"
                '{"isSoil":true/false,"confidence":<0-100>,'
                '"detectedContent":"what you see","rejectionReason":"if rejected"}'
            )},
        ]}],
        "temperature": 0.1,
        "max_tokens": 150,
    }
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(GROQ_API_URL,
                         headers={"Authorization": f"Bearer {api_key}"},
                         json=payload)
        r.raise_for_status()
    return _parse_json(r.json()["choices"][0]["message"]["content"])


# ── Stage 2: OpenCV Analysis ───────────────────────────────────────────────────

def _cv_analysis(image_path: str) -> dict:
    """
    Extract objective pixel-level measurements using OpenCV.
    Every image produces different values based on actual pixels.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError("OpenCV could not read image")

    img_bgr = cv2.resize(img_bgr, (400, 400))
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    img_lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # ── Dominant colour (mean HSV + RGB) ──────────────────────────────────────
    mean_h  = float(np.mean(img_hsv[:, :, 0]))   # 0-179
    mean_s  = float(np.mean(img_hsv[:, :, 1]))   # 0-255
    mean_v  = float(np.mean(img_hsv[:, :, 2]))   # 0-255
    mean_r  = float(np.mean(img_rgb[:, :, 0]))
    mean_g  = float(np.mean(img_rgb[:, :, 1]))
    mean_b  = float(np.mean(img_rgb[:, :, 2]))
    hex_col = "#{:02X}{:02X}{:02X}".format(int(mean_r), int(mean_g), int(mean_b))

    # ── Brightness (L channel from LAB) ───────────────────────────────────────
    brightness = float(np.mean(img_lab[:, :, 0]))  # 0-255

    # ── Texture — Laplacian variance (higher = coarser) ───────────────────────
    lap_var = float(cv2.Laplacian(img_gray, cv2.CV_64F).var())

    # ── Edge density — Canny edges ────────────────────────────────────────────
    edges      = cv2.Canny(img_gray, 50, 150)
    edge_density = float(np.sum(edges > 0)) / (400 * 400)

    # ── Crack detection — morphological analysis ──────────────────────────────
    kernel     = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    tophat     = cv2.morphologyEx(img_gray, cv2.MORPH_BLACKHAT, kernel)
    crack_score = float(np.mean(tophat))  # higher = more cracks/dark lines

    # ── Surface uniformity — std dev of gray ──────────────────────────────────
    uniformity = float(np.std(img_gray))  # lower = more uniform

    # ── Stone/gravel detection — high-contrast bright spots ───────────────────
    _, bright_mask = cv2.threshold(img_gray, 200, 255, cv2.THRESH_BINARY)
    stone_pct = float(np.sum(bright_mask > 0)) / (400 * 400) * 100

    # ── Moisture indicator — dark saturation pattern ──────────────────────────
    # Wet soil: dark (low V) + low saturation; dry soil: lighter + variable S
    dark_mask   = img_hsv[:, :, 2] < 80
    moisture_px = float(np.sum(dark_mask)) / (400 * 400)

    # ── Organic matter indicator — very dark pixels ───────────────────────────
    very_dark   = img_hsv[:, :, 2] < 60
    om_dark_pct = float(np.sum(very_dark)) / (400 * 400)

    # ── Colour category from HSV ───────────────────────────────────────────────
    colour_label = _classify_colour(mean_h, mean_s, mean_v, mean_r, mean_g, mean_b)

    # ── Brightness level ──────────────────────────────────────────────────────
    if brightness < 55:    bl = "Very Dark"
    elif brightness < 95:  bl = "Dark"
    elif brightness < 145: bl = "Medium"
    elif brightness < 195: bl = "Light"
    else:                  bl = "Very Light"

    # ── Texture label ─────────────────────────────────────────────────────────
    if lap_var < 80:    texture = "Fine"
    elif lap_var < 300: texture = "Medium"
    elif lap_var < 800: texture = "Coarse"
    else:               texture = "Gritty"

    # ── Moisture label ────────────────────────────────────────────────────────
    if moisture_px > 0.45:   moisture = "Wet"
    elif moisture_px > 0.28: moisture = "Moist"
    elif moisture_px > 0.12: moisture = "Moderate"
    else:                    moisture = "Dry"

    # ── Organic matter label ──────────────────────────────────────────────────
    if om_dark_pct > 0.35:   om = "High"
    elif om_dark_pct > 0.12: om = "Moderate"
    else:                    om = "Low"

    # ── Surface condition ─────────────────────────────────────────────────────
    if crack_score > 8:      surface = "Cracked"
    elif uniformity < 30:    surface = "Smooth"
    elif uniformity > 70:    surface = "Loose"
    elif edge_density > 0.15: surface = "Granular"
    else:                    surface = "Compacted"

    return {
        # Raw measurements
        "meanH": round(mean_h, 1),
        "meanS": round(mean_s, 1),
        "meanV": round(mean_v, 1),
        "meanR": round(mean_r, 1),
        "meanG": round(mean_g, 1),
        "meanB": round(mean_b, 1),
        "brightness": round(brightness, 1),
        "lapVariance": round(lap_var, 1),
        "edgeDensity": round(edge_density, 4),
        "crackScore": round(crack_score, 2),
        "uniformity": round(uniformity, 1),
        "stonePct": round(stone_pct, 1),
        "moisturePx": round(moisture_px, 3),
        "omDarkPct": round(om_dark_pct, 3),
        # Derived labels
        "colourHex": hex_col,
        "colourLabel": colour_label,
        "brightnessLevel": bl,
        "texture": texture,
        "moisture": moisture,
        "organicMatter": om,
        "surfaceCondition": surface,
    }


def _classify_colour(h, s, v, r, g, b) -> str:
    """Map HSV + RGB to a soil colour label used for pH estimation."""
    # Normalise hue to 0-360
    hue = h * 2  # OpenCV hue is 0-179

    if v < 50:
        return "Black"
    if v > 200 and s < 40:
        return "White"
    if v > 180 and s < 60:
        return "Pale Grey" if hue > 180 else "Light Tan"
    if 100 < hue < 140 and s > 40:
        return "Grey"
    if hue < 20 or hue > 340:
        if s > 120:
            return "Bright Red" if v > 150 else "Red"
        return "Reddish Brown" if v > 100 else "Dark Reddish Brown"
    if 20 <= hue < 40:
        if s > 100:
            return "Red Orange" if v > 150 else "Reddish Brown"
        return "Brown"
    if 40 <= hue < 60:
        if s > 80:
            return "Pale Yellow" if v > 160 else "Dark Yellow Brown"
        return "Dark Brown"
    if 60 <= hue < 100:
        return "Olive Brown"
    if v < 100:
        return "Dark Brown"
    if v < 150:
        return "Brown"
    return "Light Brown"


# ── Stage 3: Groq Vision AI Classification ────────────────────────────────────

async def _ai_classify(b64: str, mime: str, cv: dict, context: dict, api_key: str) -> dict:
    """
    Groq Vision sees the image + CV measurements and classifies soil features.
    CV measurements anchor the AI so it cannot hallucinate colour/brightness.
    """
    ctx = f"Crop={context.get('crop','Unknown')}, Season={context.get('season','Unknown')}"
    payload = {
        "model": VISION_MODEL,
        "messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
            {"type": "text", "text": (
                f"You are a soil scientist. Farm context: {ctx}\n\n"
                f"OpenCV has measured this image objectively:\n"
                f"- Dominant colour hex: {cv['colourHex']}\n"
                f"- Brightness (0-255): {cv['brightness']} → {cv['brightnessLevel']}\n"
                f"- Texture variance: {cv['lapVariance']} → {cv['texture']}\n"
                f"- Moisture indicator: {cv['moisturePx']:.2f} → {cv['moisture']}\n"
                f"- Organic matter dark pixels: {cv['omDarkPct']:.2f} → {cv['organicMatter']}\n"
                f"- Crack score: {cv['crackScore']} → {cv['surfaceCondition']}\n"
                f"- Stone percentage: {cv['stonePct']}%\n\n"
                "Using the image AND the CV measurements above, classify:\n"
                "1. soilType: Clay/Sandy/Loamy/Black/Red/Laterite/Alluvial/Sandy Loam/Clay Loam\n"
                "2. soilColour: exact colour name matching the hex (e.g. Pale Yellow, Bright Red, Dark Brown, Black, Grey)\n"
                "3. confidence: 0-100 how clearly soil features are visible\n"
                "4. visualObservations: 2 sentences describing what you see\n\n"
                "IMPORTANT: soilColour MUST match the hex colour. "
                f"Hex {cv['colourHex']} with brightness {cv['brightnessLevel']} "
                "— do NOT say Brown if the hex shows red or pale yellow.\n\n"
                "Reply ONLY raw JSON:\n"
                '{"soilType":"...","soilColour":"...","confidence":<0-100>,"visualObservations":"..."}'
            )},
        ]}],
        "temperature": 0.1,
        "max_tokens": 250,
    }
    async with httpx.AsyncClient(timeout=45) as c:
        r = await c.post(GROQ_API_URL,
                         headers={"Authorization": f"Bearer {api_key}"},
                         json=payload)
        r.raise_for_status()
    return _parse_json(r.json()["choices"][0]["message"]["content"])


# ── Stage 4: Parameter Estimation ─────────────────────────────────────────────

def _estimate_params(cv: dict, ai: dict) -> dict:
    """
    Derive pH/EC/OC/NPK from OpenCV measurements + AI classification.
    pH is driven by COLOUR (strongest visual indicator).
    All values include a confidence score.
    """
    colour     = ai.get("soilColour", cv["colourLabel"]).lower()
    soil_type  = ai.get("soilType", "Loamy")
    moisture   = cv["moisture"]
    om         = cv["organicMatter"]
    bl         = cv["brightnessLevel"]
    surface    = cv["surfaceCondition"]
    mean_v     = cv["meanV"]
    mean_s     = cv["meanS"]
    mean_h     = cv["meanH"]

    # ── pH from colour (primary signal) ───────────────────────────────────────
    # Soil colour reflects iron oxide chemistry and leaching history
    if   re.search(r"pale.?yell|bleach|ash|light.?grey|light.?gray", colour): ph_base, ph_conf = 4.8, 75
    elif re.search(r"white|salt|calcar",                               colour): ph_base, ph_conf = 8.2, 80
    elif re.search(r"bright.?red|vivid.?red",                          colour): ph_base, ph_conf = 5.2, 78
    elif re.search(r"red.?orange|orange.?red",                         colour): ph_base, ph_conf = 5.6, 72
    elif re.search(r"\bred\b",                                         colour): ph_base, ph_conf = 5.8, 70
    elif re.search(r"reddish.?brown|red.?brown|dark.?reddish",         colour): ph_base, ph_conf = 6.1, 68
    elif re.search(r"laterite|dusky.?red",                             colour): ph_base, ph_conf = 5.4, 72
    elif re.search(r"pale|light.?brown|tan|buff|light.?tan",           colour): ph_base, ph_conf = 6.3, 65
    elif re.search(r"grey|gray",                                       colour): ph_base, ph_conf = 7.3, 70
    elif re.search(r"black|very.?dark",                                colour): ph_base, ph_conf = 7.0, 72
    elif re.search(r"dark.?brown|chocolate|olive",                     colour): ph_base, ph_conf = 6.5, 68
    elif re.search(r"brown",                                           colour): ph_base, ph_conf = 6.8, 60
    else:
        # Fallback: use OpenCV hue directly
        hue = mean_h * 2  # 0-360
        if hue < 20 or hue > 340:   ph_base, ph_conf = 5.6, 50  # red hue
        elif hue < 40:               ph_base, ph_conf = 6.2, 45  # orange-brown
        elif mean_v > 190:           ph_base, ph_conf = 8.0, 40  # very bright = alkaline
        elif mean_v < 60:            ph_base, ph_conf = 7.0, 45  # very dark = neutral
        else:                        ph_base, ph_conf = 6.5, 40

    # Fine adjustments from other CV signals
    if om == "High":                    ph_base = max(5.0, ph_base - 0.3)
    if om == "Low" and ph_base > 6.0:   ph_base = min(8.5, ph_base + 0.2)
    if surface == "Cracked":            ph_base = min(8.5, ph_base + 0.2)
    if moisture == "Wet":               ph_base = max(4.5, ph_base - 0.2)
    # Saturation boost: high S + red hue = more acidic
    if mean_s > 120 and mean_h < 15:    ph_base = max(4.5, ph_base - 0.3)
    estimated_ph = round(ph_base, 1)

    # ── EC from moisture + surface + colour ───────────────────────────────────
    ec_base = {"Dry": 1.8, "Moderate": 0.8, "Moist": 0.5, "Wet": 0.3}[moisture]
    ec_adj  = (0.5 if surface == "Cracked" else 0.2 if surface == "Compacted" else 0)
    ec_adj += (1.5 if re.search(r"white|salt", colour) else 0)
    # Dry + cracked = saline risk
    ec_adj += (0.4 if moisture == "Dry" and surface == "Cracked" else 0)
    estimated_ec = round(min(8.0, ec_base + ec_adj), 2)
    ec_conf = 55 if moisture in ("Dry", "Wet") else 45

    # ── OC from brightness + organic matter ───────────────────────────────────
    oc_base = {"Low": 0.25, "Moderate": 0.65, "High": 1.55}[om]
    oc_adj  = {"Very Dark": 0.38, "Dark": 0.20, "Medium": 0.0,
               "Light": -0.15, "Very Light": -0.20}[bl]
    # Use actual brightness value for finer adjustment
    oc_adj += (mean_v / 255 - 0.5) * -0.2
    estimated_oc = round(max(0.1, min(4.0, oc_base + oc_adj)), 2)
    oc_conf = 60 if bl in ("Very Dark", "Dark", "Very Light") else 50

    # ── N from OC + brightness ────────────────────────────────────────────────
    n_base = {"Low": 38, "Moderate": 82, "High": 148}[om]
    n_adj  = {"Very Dark": 25, "Dark": 14, "Medium": 0,
              "Light": -14, "Very Light": -20}[bl]
    # Stone percentage reduces N
    n_adj -= cv["stonePct"] * 0.5
    estimated_n = round(max(10, min(280, n_base + n_adj)))
    n_conf = 55

    # ── P from soil type + OM + pH (acidic soils lock P) ─────────────────────
    p_base = {"Black": 45, "Alluvial": 40, "Clay Loam": 35, "Loamy": 30,
              "Clay": 26, "Sandy Loam": 20, "Red": 16, "Sandy": 12, "Laterite": 10
              }.get(soil_type, 26)
    p_adj  = (12 if om == "High" else -8 if om == "Low" else 0)
    p_adj += (-8 if estimated_ph < 5.5 else -4 if estimated_ph < 6.0 else 0)
    estimated_p = round(max(5, min(120, p_base + p_adj)))
    p_conf = 50

    # ── K from soil type + moisture ───────────────────────────────────────────
    k_base = {"Black": 210, "Clay": 195, "Clay Loam": 175, "Alluvial": 160,
              "Loamy": 150, "Sandy Loam": 125, "Red": 110, "Sandy": 90, "Laterite": 80
              }.get(soil_type, 145)
    k_adj  = (-18 if moisture == "Wet" else 12 if moisture == "Dry" else 0)
    # Sandy texture leaches K
    k_adj -= (20 if cv["texture"] in ("Coarse", "Gritty") else 0)
    estimated_k = round(max(50, min(450, k_base + k_adj)))
    k_conf = 52

    ph_range = (
        "4.5-5.5" if estimated_ph < 5.5 else
        "5.5-6.0" if estimated_ph < 6.0 else
        "6.0-6.5" if estimated_ph < 6.5 else
        "6.5-7.0" if estimated_ph < 7.0 else
        "7.0-7.5" if estimated_ph < 7.5 else
        "7.5-8.5"
    )

    return {
        "estimatedPH":         estimated_ph,
        "estimatedEC":         estimated_ec,
        "estimatedOC":         estimated_oc,
        "estimatedNitrogen":   float(estimated_n),
        "estimatedPhosphorus": float(estimated_p),
        "estimatedPotassium":  float(estimated_k),
        "phRange":             ph_range,
        "confidenceScores": {
            "ph":  ph_conf,
            "ec":  ec_conf,
            "oc":  oc_conf,
            "n":   n_conf,
            "p":   p_conf,
            "k":   k_conf,
        },
    }


# ── Main Entry Point ───────────────────────────────────────────────────────────

async def analyse_soil_image(image_path: str, context: dict) -> dict:
    try:
        # Stage 1: OpenCV analysis (always available)
        cv = _cv_analysis(image_path)
        logger.info(f"[ImageAgent] CV: colour={cv['colourLabel']} brightness={cv['brightnessLevel']} moisture={cv['moisture']} om={cv['organicMatter']}")

        # Stage 2: AI classification (skip if no vision model available)
        api_key = settings.GROQ_API_KEY
        ai = {}
        confidence = MIN_CONFIDENCE

        if api_key and not HAS_VISION:
            # No vision model — derive soil type from CV colour label
            colour = cv["colourLabel"].lower()
            if re.search(r"black", colour):                    ai = {"soilType": "Black",      "soilColour": cv["colourLabel"]}
            elif re.search(r"red|reddish|laterite", colour):  ai = {"soilType": "Red",        "soilColour": cv["colourLabel"]}
            elif re.search(r"grey|gray", colour):             ai = {"soilType": "Alluvial",   "soilColour": cv["colourLabel"]}
            elif re.search(r"pale|light|tan", colour):        ai = {"soilType": "Sandy Loam",  "soilColour": cv["colourLabel"]}
            elif re.search(r"dark.?brown|chocolate", colour): ai = {"soilType": "Clay Loam",  "soilColour": cv["colourLabel"]}
            else:                                              ai = {"soilType": "Loamy",      "soilColour": cv["colourLabel"]}
            ai["visualObservations"] = f"OpenCV analysis: {cv['brightnessLevel']} soil with {cv['texture'].lower()} texture and {cv['moisture'].lower()} moisture."
            confidence = 60
        elif api_key:
            try:
                b64, mime = _to_base64(image_path)
                # Stage 1: Validate
                validation = await _validate(b64, mime, api_key)
                if not validation.get("isSoil", True) and int(validation.get("confidence", 0)) >= 55:
                    return {
                        "available": False, "rejected": True,
                        "rejectionReason": validation.get("rejectionReason", "Not agricultural soil."),
                        "confidence": validation.get("confidence", 0),
                    }
                ai = await _ai_classify(b64, mime, cv, context, api_key)
                confidence = max(MIN_CONFIDENCE, int(ai.get("confidence", MIN_CONFIDENCE)))
            except Exception as e:
                logger.warning(f"[ImageAgent] Vision API failed, using CV fallback: {e}")
                ai = {"soilType": "Loamy", "soilColour": cv["colourLabel"], "visualObservations": "CV-only analysis."}
                confidence = MIN_CONFIDENCE

        # Stage 3: Parameter estimation from CV + AI
        params = _estimate_params(cv, ai)
        logger.info(f"[ImageAgent] Params: pH={params['estimatedPH']} OC={params['estimatedOC']} N={params['estimatedNitrogen']}")

        return {
            "available":          True,
            "soilType":           ai.get("soilType", "Loamy"),
            "soilColour":         ai.get("soilColour", cv["colourLabel"]),
            "visualObservations": ai.get("visualObservations", ""),
            "texture":            cv["texture"],
            "moisture":           cv["moisture"],
            "organicMatter":      cv["organicMatter"],
            "surfaceCondition":   cv["surfaceCondition"],
            "brightnessLevel":    cv["brightnessLevel"],
            "colourHex":          cv["colourHex"],
            "stonePct":           cv["stonePct"],
            "crackScore":         cv["crackScore"],
            "uniformity":         cv["uniformity"],
            "confidence":         confidence,
            **params,
        }

    except Exception as e:
        logger.error(f"[ImageAgent] Pipeline error: {e}", exc_info=True)
        return {"available": False, "rejected": False, "reason": str(e)}
