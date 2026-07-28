"""
Soil report service — linked to authenticated user.
"""
import os
import logging
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.database import get_db
from app.config import settings
from app.agents.soil_agent import run_soil_analysis
from app.agents.groq_agent import get_groq_analysis

logger = logging.getLogger(__name__)
COLLECTION = "soilreports"


def _serialize(doc: dict) -> dict:
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    if isinstance(doc.get("createdAt"), datetime):
        doc["createdAt"] = doc["createdAt"].isoformat()
    return doc


def _to_oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid report ID")


def _build_doc(user: dict, soil_data: dict, engine_result: dict, analysis: dict, image_url: str = "") -> dict:
    """Build the MongoDB document — farmerName/mobileNumber come from the logged-in user."""
    return {
        "userId":                 user["id"],
        "userFullName":           user["fullName"],
        "farmerName":             user["fullName"],
        "mobileNumber":           user["mobileNumber"],
        "crop":                   soil_data.get("crop", ""),
        "previousCrop":           soil_data.get("previousCrop", ""),
        "soilType":               soil_data.get("soilType", ""),
        "soilColour":             soil_data.get("soilColour", ""),
        "irrigationType":         soil_data.get("irrigationType", "Drip"),
        "season":                 soil_data.get("season", "Kharif"),
        "soilPH":                 float(soil_data.get("soilPH", 7.0)),
        "electricalConductivity": float(soil_data.get("electricalConductivity", 0.5)),
        "organicCarbon":          float(soil_data.get("organicCarbon", 0.75)),
        "nitrogen":               float(soil_data.get("nitrogen", 80.0)),
        "phosphorus":             float(soil_data.get("phosphorus", 40.0)),
        "potassium":              float(soil_data.get("potassium", 150.0)),
        "soilImageUrl":           image_url,
        "healthScore":            engine_result["healthScore"]["overall"],
        "analysis":               analysis,
        "createdAt":              datetime.now(timezone.utc),
    }


async def create_report_from_image_form(payload: dict, user: dict) -> dict:
    """
    Image + form pipeline:
    payload contains imageAnalysis (from vision stage) + manual form fields.
    The rule engine uses the MANUAL lab values; imageAnalysis provides visual bonus only.
    """
    image_analysis = payload.get("imageAnalysis") or {}

    # Build soil_data from manual form fields — these drive the health score
    soil_data = {k: v for k, v in payload.items() if k not in ("imageAnalysis", "imageData", "mimeType")}

    # Pass visual fields so _normalise() picks them up for the bonus
    soil_data["moisture"]      = image_analysis.get("moisture", "")
    soil_data["organicMatter"] = image_analysis.get("organicMatter", "")
    soil_data["texture"]       = image_analysis.get("texture", "")
    soil_data["soilType"]      = soil_data.get("soilType") or image_analysis.get("soilType", "Loamy")
    soil_data["soilColour"]    = soil_data.get("soilColour") or image_analysis.get("soilColour", "Brown")

    # Save image to disk if base64 provided
    image_url = ""
    b64  = payload.get("imageData")
    mime = payload.get("mimeType", "image/jpeg")
    if b64:
        import base64, uuid
        ext   = mime.split("/")[-1].replace("jpeg", "jpg")
        fname = f"{uuid.uuid4().hex}.{ext}"
        fpath = os.path.join(settings.UPLOAD_DIR, fname)
        with open(fpath, "wb") as f:
            f.write(base64.b64decode(b64))
        image_url = f"/uploads/{fname}"

    engine_result = run_soil_analysis(soil_data)
    ai_narrative  = await get_groq_analysis(soil_data, engine_result, user.get("fullName", "Farmer"))
    analysis      = {**engine_result, "aiNarrative": ai_narrative, "imageAnalysis": image_analysis}

    doc    = _build_doc(user, soil_data, engine_result, analysis, image_url)
    result = await get_db()[COLLECTION].insert_one(doc)
    created = await get_db()[COLLECTION].find_one({"_id": result.inserted_id})
    return _serialize(created)


async def create_report_from_manual(soil_data: dict, user: dict) -> dict:
    engine_result = run_soil_analysis(soil_data)
    ai_narrative  = await get_groq_analysis(soil_data, engine_result, user.get("fullName", "Farmer"))
    analysis      = {**engine_result, "aiNarrative": ai_narrative}

    doc    = _build_doc(user, soil_data, engine_result, analysis, soil_data.get("soilImageUrl", ""))
    result = await get_db()[COLLECTION].insert_one(doc)
    created = await get_db()[COLLECTION].find_one({"_id": result.inserted_id})
    return _serialize(created)


async def get_reports(user_id: str, search: str = None, page: int = 1, limit: int = 10) -> dict:
    query = {"userId": user_id}
    if search:
        query["$or"] = [
            {"soilType": {"$regex": search, "$options": "i"}},
            {"crop":     {"$regex": search, "$options": "i"}},
        ]

    col   = get_db()[COLLECTION]
    total = await col.count_documents(query)
    skip  = (page - 1) * limit

    cursor = col.find(query, {
        "farmerName": 1, "userFullName": 1, "soilType": 1, "soilColour": 1,
        "healthScore": 1, "crop": 1, "season": 1, "soilImageUrl": 1,
        "analysis.healthScore": 1, "createdAt": 1,
    }).sort("createdAt", -1).skip(skip).limit(limit)

    docs = [_serialize(d) async for d in cursor]
    return {"data": docs, "total": total, "page": page, "pages": -(-total // limit)}


async def get_report(report_id: str, user_id: str) -> dict:
    doc = await get_db()[COLLECTION].find_one({"_id": _to_oid(report_id), "userId": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    return _serialize(doc)


async def delete_report(report_id: str, user_id: str) -> None:
    doc = await get_db()[COLLECTION].find_one_and_delete({"_id": _to_oid(report_id), "userId": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")


async def get_agent_context(report_id: str) -> dict:
    doc = await get_db()[COLLECTION].find_one({"_id": _to_oid(report_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    doc      = _serialize(doc)
    analysis = doc.get("analysis") or {}
    return {
        "reportId":       doc["_id"],
        "user":           {"name": doc.get("userFullName"), "id": doc.get("userId")},
        "farmer":         {"name": doc.get("farmerName"), "mobile": doc.get("mobileNumber")},
        "soil":           {
            "type":   doc.get("soilType"),
            "colour": doc.get("soilColour"),
            "ph":     doc.get("soilPH"),
            "ec":     doc.get("electricalConductivity"),
            "oc":     doc.get("organicCarbon"),
            "n":      doc.get("nitrogen"),
            "p":      doc.get("phosphorus"),
            "k":      doc.get("potassium"),
        },
        "crop":           doc.get("crop"),
        "season":         doc.get("season"),
        "healthScore":    analysis.get("healthScore"),
        "suitableCrops":  [c["crop"] for c in (analysis.get("cropSuitability") or {}).get("suitable", [])],
        "risks":          analysis.get("risks"),
        "aiSummary":      (analysis.get("aiNarrative") or {}).get("soilStory"),
        "readyForAgents": ["weather-agent", "market-agent", "scheme-agent", "disease-agent"],
    }
