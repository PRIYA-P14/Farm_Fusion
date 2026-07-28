"""
CropHealthAgent  (Agent #5 of AgriVerse AI - Multi-Agent Smart Farming Assistant)

Responsibilities:
  1. Diagnose crop disease from reported symptoms
  2. Assess severity and estimated yield loss
  3. Recommend treatment steps
  4. Suggest prevention measures
  5. Estimate recovery timeline

Can be used directly (see demo.py) or through the FastAPI wrapper (api.py).
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import date, timedelta

from data import DISEASE_DB, CROP_DISEASES, SUPPORTED_CROPS, SEVERITY_SCORE


@dataclass
class CropHealthAgent:
    name: str = "Crop Health Agent"

    # ---------- 1. Diagnose disease from symptoms ----------
    def diagnose(self, crop: str, symptoms: list[str]) -> dict:
        """
        Match reported symptoms against known diseases for the given crop.
        Returns the best-matching disease with a confidence score.
        """
        crop = crop.strip().title()
        if crop not in CROP_DISEASES:
            return {"error": f"Crop '{crop}' not supported. Choose from {SUPPORTED_CROPS}"}

        symptoms_lower = [s.strip().lower() for s in symptoms]
        candidates = CROP_DISEASES[crop]

        scores = []
        for disease_id in candidates:
            disease = DISEASE_DB[disease_id]
            known = [s.lower() for s in disease["symptoms"]]
            matches = sum(
                1 for s in symptoms_lower
                if any(s in k or k in s for k in known)
            )
            confidence = round(matches / max(len(known), 1) * 100, 1)
            scores.append((confidence, disease_id, matches))

        scores.sort(reverse=True)
        best_confidence, best_id, best_matches = scores[0]

        # if nothing matched at all, fall back to healthy
        if best_matches == 0:
            best_id = "healthy"
            best_confidence = 0.0

        disease = DISEASE_DB[best_id]
        return {
            "crop": crop,
            "diagnosed_disease": disease["name"],
            "disease_id": best_id,
            "confidence_percent": best_confidence,
            "severity": disease["severity"],
            "matched_symptoms": [
                s for s in symptoms_lower
                if any(s in k or k in s for k in [x.lower() for x in disease["symptoms"]])
            ],
        }

    # ---------- 2. Get full disease report ----------
    def get_disease_report(self, disease_id: str) -> dict:
        if disease_id not in DISEASE_DB:
            return {"error": f"Unknown disease id '{disease_id}'"}
        d = DISEASE_DB[disease_id]
        return {
            "disease_id": disease_id,
            "name": d["name"],
            "crop": d["crop"],
            "severity": d["severity"],
            "causes": d["causes"],
            "symptoms": d["symptoms"],
            "treatment": d["treatment"],
            "prevention": d["prevention"],
            "estimated_yield_loss_percent": d["yield_loss_percent"],
            "estimated_recovery_days": d["recovery_days"],
        }

    # ---------- 3. Treatment plan ----------
    def get_treatment_plan(self, disease_id: str) -> dict:
        if disease_id not in DISEASE_DB:
            return {"error": f"Unknown disease id '{disease_id}'"}
        d = DISEASE_DB[disease_id]
        today = date.today()
        recovery_date = (today + timedelta(days=d["recovery_days"])).isoformat() if d["recovery_days"] > 0 else "N/A"
        return {
            "disease": d["name"],
            "severity": d["severity"],
            "immediate_actions": d["treatment"],
            "prevention_measures": d["prevention"],
            "expected_recovery_date": recovery_date,
            "recovery_days": d["recovery_days"],
            "urgency": "Act within 24 hours" if SEVERITY_SCORE[d["severity"]] >= 3 else "Act within 3 days",
        }

    # ---------- 4. Yield impact assessment ----------
    def assess_yield_impact(self, disease_id: str, field_area_acres: float, expected_yield_kg_per_acre: float) -> dict:
        if disease_id not in DISEASE_DB:
            return {"error": f"Unknown disease id '{disease_id}'"}
        d = DISEASE_DB[disease_id]
        loss_pct = d["yield_loss_percent"] / 100
        total_expected = round(field_area_acres * expected_yield_kg_per_acre, 2)
        estimated_loss = round(total_expected * loss_pct, 2)
        estimated_remaining = round(total_expected - estimated_loss, 2)
        return {
            "disease": d["name"],
            "field_area_acres": field_area_acres,
            "expected_yield_kg": total_expected,
            "yield_loss_percent": d["yield_loss_percent"],
            "estimated_loss_kg": estimated_loss,
            "estimated_remaining_yield_kg": estimated_remaining,
        }

    # ---------- Combined run (what the orchestrator/other agents will call) ----------
    def run(self, query: dict) -> dict:
        """
        query = {
          "crop": "Tomato",
          "symptoms": ["yellow leaves", "brown spots", "wilting"],
          "field_area_acres": 2.5,          # optional, default 1.0
          "expected_yield_kg_per_acre": 800  # optional, default 500
        }
        """
        crop = query.get("crop", "")
        symptoms = query.get("symptoms", [])
        field_area = query.get("field_area_acres", 1.0)
        expected_yield = query.get("expected_yield_kg_per_acre", 500)

        diagnosis = self.diagnose(crop, symptoms)
        if "error" in diagnosis:
            return {"agent": self.name, "error": diagnosis["error"]}

        disease_id = diagnosis["disease_id"]
        report = self.get_disease_report(disease_id)
        treatment = self.get_treatment_plan(disease_id)
        yield_impact = self.assess_yield_impact(disease_id, field_area, expected_yield)

        return {
            "agent": self.name,
            "diagnosis": diagnosis,
            "disease_report": report,
            "treatment_plan": treatment,
            "yield_impact": yield_impact,
        }
