"""
crop_health_data.py
Data utilities for the Crop Health Agent.

In production, extend this module to:
  - Fetch real-time disease outbreak alerts from government APIs
  - Load weather data to adjust spread risk predictions
  - Cache model predictions to a database
"""

from disease_database import (
    DISEASE_DATABASE,
    CLASS_LABELS,
    NUM_CLASSES,
    SPREAD_RISK_SCORE,
)


def get_all_crops() -> list[str]:
    """Return a deduplicated sorted list of all supported crop names."""
    crops = {v["crop"] for v in DISEASE_DATABASE.values() if v["crop"] != "Any"}
    return sorted(crops)


def get_diseases_for_crop(crop: str) -> list[dict]:
    """
    Return all disease entries for a given crop name.

    Args:
        crop: Crop name, e.g. "Tomato".

    Returns:
        List of disease info dicts for that crop.
    """
    return [
        {"id": k, **v}
        for k, v in DISEASE_DATABASE.items()
        if v["crop"].lower() == crop.lower()
    ]


def get_high_risk_diseases() -> list[dict]:
    """Return all diseases with spread risk of High or Critical."""
    return [
        {"id": k, "name": v["disease_name"], "crop": v["crop"], "spread_risk": v["spread_risk"]}
        for k, v in DISEASE_DATABASE.items()
        if SPREAD_RISK_SCORE.get(v["spread_risk"], 0) >= 3
    ]
