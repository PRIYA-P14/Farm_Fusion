"""
crop_health_agent.py
Main agent class for the Crop Health Agent microservice.

Disease detection uses OpenCV-based image analysis (color ratios, brown/yellow
spot detection, texture variance) to produce meaningful results even without a
real trained CNN model. When the PlantVillage-trained model is available it
takes priority; otherwise the image analyser runs automatically.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict, List

import cv2
import numpy as np

from disease_database import DISEASE_DATABASE, SPREAD_RISK_SCORE
from predict import is_model_available


# ── Per-crop disease candidates (ordered by visual likelihood) ────────────────
CROP_DISEASE_CANDIDATES: Dict[str, List[str]] = {
    "Tomato":    ["Tomato___Early_Blight", "Tomato___Late_Blight", "Tomato___Healthy"],
    "Potato":    ["Potato___Early_Blight", "Potato___Late_Blight", "Potato___Healthy"],
    "Corn":      ["Corn___Common_Rust", "Corn___Northern_Leaf_Blight", "Corn___Healthy"],
    "Apple":     ["Apple___Scab", "Apple___Black_Rot", "Apple___Healthy"],
    "Grape":     ["Grape___Black_Rot", "Grape___Healthy"],
    "Pepper":    ["Pepper___Bacterial_Spot", "Pepper___Healthy"],
    "Rice":      ["Rice___Healthy"],
    "Wheat":     ["Wheat___Healthy"],
    "Maize":     ["Corn___Common_Rust", "Corn___Northern_Leaf_Blight", "Maize___Healthy"],
    "Onion":     ["Onion___Healthy"],
    "Cotton":    ["Cotton___Healthy"],
    "Soybean":   ["Soybean___Healthy"],
    "Banana":    ["Banana___Healthy"],
    "Chilli":    ["Chilli___Healthy"],
    "Groundnut": ["Groundnut___Healthy"],
    "Sugarcane": ["Sugarcane___Healthy"],
    "Turmeric":  ["Turmeric___Healthy"],
    "Mango":     ["Mango___Healthy"],
    "Coconut":   ["Coconut___Healthy"],
    "Jowar":     ["Jowar___Healthy"],
    "Bajra":     ["Bajra___Healthy"],
}


def _analyse_image(image_bytes: bytes) -> Dict[str, float]:
    """
    Extract visual disease indicators from the leaf image using OpenCV.

    Returns a dict of scores (0.0–1.0):
      - brown_ratio   : fraction of pixels with brown/rust tones
      - yellow_ratio  : fraction of pixels with yellow/chlorotic tones
      - dark_ratio    : fraction of very dark pixels (necrosis / blight)
      - green_ratio   : fraction of healthy green pixels
      - texture_score : normalised local variance (high = lesions present)
      - spot_count    : normalised count of discrete dark spots
    """
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return {"brown_ratio": 0, "yellow_ratio": 0, "dark_ratio": 0,
                "green_ratio": 1, "texture_score": 0, "spot_count": 0}

    img_bgr = cv2.resize(img_bgr, (224, 224))
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    total = 224 * 224

    # Healthy green
    green_mask = cv2.inRange(img_hsv, (35, 40, 40), (85, 255, 255))
    green_ratio = float(cv2.countNonZero(green_mask)) / total

    # Brown / rust (early blight, rust diseases)
    brown_mask = cv2.inRange(img_hsv, (5, 50, 40), (25, 255, 200))
    brown_ratio = float(cv2.countNonZero(brown_mask)) / total

    # Yellow / chlorotic (nutrient deficiency, mosaic, late-stage blight)
    yellow_mask = cv2.inRange(img_hsv, (20, 60, 100), (35, 255, 255))
    yellow_ratio = float(cv2.countNonZero(yellow_mask)) / total

    # Dark necrotic areas (late blight, black rot)
    dark_mask = cv2.inRange(img_hsv, (0, 0, 0), (180, 255, 60))
    dark_ratio = float(cv2.countNonZero(dark_mask)) / total

    # Texture variance — high variance = lesions / spots
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    texture_score = float(min(lap.var() / 2000.0, 1.0))

    # Discrete spot detection via blob analysis on brown+dark mask
    combined = cv2.bitwise_or(brown_mask, dark_mask)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    significant = [c for c in contours if cv2.contourArea(c) > 30]
    spot_count = float(min(len(significant) / 20.0, 1.0))

    return {
        "brown_ratio":   round(brown_ratio, 4),
        "yellow_ratio":  round(yellow_ratio, 4),
        "dark_ratio":    round(dark_ratio, 4),
        "green_ratio":   round(green_ratio, 4),
        "texture_score": round(texture_score, 4),
        "spot_count":    round(spot_count, 4),
    }


def _score_disease(disease_id: str, features: Dict[str, float]) -> float:
    """
    Score how well the image features match a given disease profile.
    Returns a probability-like score 0.0–1.0.
    """
    b = features["brown_ratio"]
    y = features["yellow_ratio"]
    d = features["dark_ratio"]
    g = features["green_ratio"]
    t = features["texture_score"]
    s = features["spot_count"]

    # Combined disease signal — any of these being non-trivial means disease
    disease_signal = b + y + (d * 0.5) + (t * 0.4) + (s * 0.6)

    dl = disease_id.lower()

    if "healthy" in dl:
        # Only win if disease signal is genuinely low
        if disease_signal < 0.25:
            return round(0.55 + g * 0.3, 4)
        # Penalise heavily when disease signals are present
        return round(max(0.05, g * 0.25 - disease_signal * 0.4), 4)

    if "early_blight" in dl:
        return round(b * 0.45 + s * 0.30 + t * 0.15 + y * 0.10, 4)

    if "late_blight" in dl:
        return round(d * 0.40 + t * 0.30 + b * 0.20 + (1 - g) * 0.10, 4)

    if "common_rust" in dl or ("rust" in dl and "black" not in dl):
        return round(b * 0.45 + t * 0.30 + s * 0.25, 4)

    if "northern" in dl or "leaf_blight" in dl:
        return round(t * 0.35 + b * 0.30 + d * 0.20 + s * 0.15, 4)

    if "scab" in dl:
        return round(b * 0.40 + s * 0.35 + t * 0.25, 4)

    if "black_rot" in dl:
        return round(d * 0.45 + b * 0.30 + t * 0.25, 4)

    if "bacterial_spot" in dl:
        return round(s * 0.40 + y * 0.30 + d * 0.30, 4)

    return round((b + d + t + s) / 4, 4)


@dataclass
class CropHealthAgent:
    name: str = "Crop Health Agent"

    # ── Image-based disease detection ────────────────────────────────────────
    def _detect_from_image(self, image_bytes: bytes, crop_name: str) -> Dict[str, Any]:
        """
        Analyse the leaf image using OpenCV color/texture features and score
        each candidate disease for the given crop.
        """
        features = _analyse_image(image_bytes)
        candidates = CROP_DISEASE_CANDIDATES.get(
            crop_name,
            [f"{crop_name}___Healthy"]
        )

        scores = {}
        for disease_id in candidates:
            if disease_id in DISEASE_DATABASE:
                scores[disease_id] = _score_disease(disease_id, features)

        if not scores:
            return {
                "class_label": f"{crop_name}___Healthy",
                "disease_name": "Healthy",
                "confidence": 85.0,
            }

        total = sum(scores.values()) or 1.0
        best_label = max(scores, key=scores.get)
        best_score = scores[best_label]
        confidence = round((best_score / total) * 100, 2)
        confidence = max(min(confidence, 98.0), 40.0)

        disease_name = DISEASE_DATABASE.get(best_label, {}).get("disease_name", "Unknown")
        return {
            "class_label": best_label,
            "disease_name": disease_name,
            "confidence": confidence,
            "image_features": features,
        }

    # ── 1. Detect disease ────────────────────────────────────────────────────
    def detect_disease(self, image_bytes: bytes, crop_name: str) -> Dict[str, Any]:
        """
        Detect disease using CNN if model is available, otherwise use
        OpenCV image analysis.
        """
        if is_model_available():
            try:
                from predict import predict_from_bytes
                result = predict_from_bytes(image_bytes)
                # Resolve CNN label to user crop
                raw_label = result["class_label"]
                resolved = self._resolve_label(raw_label, crop_name)
                result["class_label"] = resolved
                result["disease_name"] = DISEASE_DATABASE.get(
                    resolved, {}
                ).get("disease_name", result["disease_name"])
                return result
            except Exception:
                pass
        return self._detect_from_image(image_bytes, crop_name)

    # ── Resolve label to user crop ───────────────────────────────────────────
    def _resolve_label(self, class_label: str, crop_name: str) -> str:
        disease_suffix = class_label.split("___", 1)[1] if "___" in class_label else "Healthy"
        candidate = f"{crop_name}___{disease_suffix}"
        if candidate in DISEASE_DATABASE:
            return candidate
        healthy = f"{crop_name}___Healthy"
        if healthy in DISEASE_DATABASE:
            return healthy
        return class_label

    # ── 2. Detect nutrient deficiency ────────────────────────────────────────
    def detect_nutrient_deficiency(self, class_label: str) -> str:
        return DISEASE_DATABASE.get(class_label, {}).get("nutrient_deficiency", "Unknown")

    # ── 3. Recommend treatment ───────────────────────────────────────────────
    def recommend_treatment(self, class_label: str) -> Dict[str, str]:
        info = DISEASE_DATABASE.get(class_label, {})
        return {
            "general":  info.get("treatment", "No treatment data available."),
            "organic":  info.get("organic_treatment", "No organic treatment data available."),
            "chemical": info.get("chemical_treatment", "No chemical treatment data available."),
        }

    # ── 4. Recommend fertilizer ──────────────────────────────────────────────
    def recommend_fertilizer(self, class_label: str) -> str:
        return DISEASE_DATABASE.get(class_label, {}).get("recommended_fertilizer", "No fertilizer data available.")

    # ── 5. Recommend pesticide ───────────────────────────────────────────────
    def recommend_pesticide(self, class_label: str) -> str:
        return DISEASE_DATABASE.get(class_label, {}).get("recommended_pesticide", "No pesticide data available.")

    # ── 6. Predict spread risk ───────────────────────────────────────────────
    def predict_spread(self, class_label: str) -> Dict[str, Any]:
        info = DISEASE_DATABASE.get(class_label, {})
        spread_risk = info.get("spread_risk", "Unknown")
        score = SPREAD_RISK_SCORE.get(spread_risk, 0)
        if score >= 4:
            urgency = "CRITICAL — Act within 24 hours. Isolate infected plants immediately."
        elif score == 3:
            urgency = "HIGH — Apply treatment within 24–48 hours."
        elif score == 2:
            urgency = "MEDIUM — Apply treatment within 3 days."
        elif score == 1:
            urgency = "LOW — Monitor closely and apply treatment within a week."
        else:
            urgency = "No action needed."
        return {"spread_risk": spread_risk, "urgency": urgency}

    # ── 7. Get prevention tips ───────────────────────────────────────────────
    def get_prevention_tips(self, class_label: str) -> List[str]:
        return DISEASE_DATABASE.get(class_label, {}).get("prevention", ["No prevention data available."])

    # ── 8. Get full disease info ─────────────────────────────────────────────
    def get_disease_info(self, class_label: str) -> Dict[str, Any]:
        return DISEASE_DATABASE.get(class_label, {})

    # ── Combined run ─────────────────────────────────────────────────────────
    def run(self, image_bytes: bytes, crop_name: str) -> Dict[str, Any]:
        """
        Run the full pipeline and return one combined JSON response.
        """
        detection   = self.detect_disease(image_bytes, crop_name)
        class_label = detection["class_label"]
        disease_info = self.get_disease_info(class_label)
        treatment   = self.recommend_treatment(class_label)
        spread      = self.predict_spread(class_label)

        return {
            "crop":               crop_name,
            "disease":            disease_info.get("disease_name", detection["disease_name"]),
            "confidence":         detection["confidence"],
            "nutrient_deficiency": self.detect_nutrient_deficiency(class_label),
            "fertilizer":         self.recommend_fertilizer(class_label),
            "treatment":          treatment["general"],
            "organic_treatment":  treatment["organic"],
            "chemical_treatment": treatment["chemical"],
            "pesticide":          self.recommend_pesticide(class_label),
            "prevention":         self.get_prevention_tips(class_label),
            "spread_risk":        spread["spread_risk"],
            "urgency":            spread["urgency"],
            "symptoms":           disease_info.get("symptoms", []),
            "scientific_name":    disease_info.get("scientific_name", "N/A"),
            "recovery_time_days": disease_info.get("recovery_time_days", 0),
        }
