"""
Government Service — Rule Engine + DB operations for government_reports collection.
"""
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from bson import ObjectId

from app.database import get_db
from app.agents.government_agent import get_government_ai_recommendation
from app.models.government_report import GOVERNMENT_REPORTS_COLLECTION, government_report_to_dict

logger = logging.getLogger(__name__)

_SCHEMES_PATH = Path(__file__).parent.parent / "datasets" / "government_schemes.json"
_schemes_cache: list = []


def _load_schemes() -> list:
    global _schemes_cache
    if not _schemes_cache:
        with open(_SCHEMES_PATH, "r", encoding="utf-8") as f:
            _schemes_cache = json.load(f)
    return _schemes_cache


def run_rule_engine(farmer: dict) -> list:
    """Match schemes based on farmer profile rules."""
    schemes = _load_schemes()
    eligible = []

    state = farmer.get("state", "").strip()
    crop = farmer.get("crop", "").strip()
    income = float(farmer.get("annual_income", 0))
    farm_size = float(farmer.get("farm_size", 0))
    farmer_type = farmer.get("farmer_type", "").strip()
    category = farmer.get("category", "General").strip()
    land_ownership = farmer.get("land_ownership", "Owned").strip()

    for scheme in schemes:
        # State check
        eligible_states = scheme.get("eligible_states", ["All"])
        if "All" not in eligible_states and state not in eligible_states:
            continue

        # Farmer type check
        scheme_types = scheme.get("farmer_types", [])
        if scheme_types and farmer_type not in scheme_types:
            continue

        # Category check
        scheme_cats = scheme.get("farmer_categories", [])
        if scheme_cats and category not in scheme_cats:
            continue

        # Income check
        income_limit = scheme.get("income_limit", 0)
        if income_limit > 0 and income > income_limit:
            continue

        # Farm size check
        farm_size_max = scheme.get("farm_size_max", 100)
        if farm_size > farm_size_max:
            continue

        # Land ownership check
        scheme_ownership = scheme.get("land_ownership", [])
        if scheme_ownership and land_ownership not in scheme_ownership:
            continue

        # Crop check
        scheme_crops = scheme.get("crops", ["All"])
        if "All" not in scheme_crops and crop not in scheme_crops:
            continue

        eligible.append(scheme)

    # Sort by priority
    eligible.sort(key=lambda s: s.get("priority", 99))
    return eligible


async def analyse_and_save(farmer: dict, user_id: str) -> dict:
    eligible_schemes = run_rule_engine(farmer)

    ai_result = await get_government_ai_recommendation(farmer, eligible_schemes)

    total_subsidy = sum(s.get("subsidy_amount", 0) for s in eligible_schemes)
    total_loan = sum(s.get("loan_amount", 0) for s in eligible_schemes)
    has_insurance = any(s.get("insurance", False) for s in eligible_schemes)

    ai_text = ""
    if ai_result.get("available"):
        parts = [
            ai_result.get("summary", ""),
            f"Top Priority: {ai_result.get('top_priority', '')}",
            ai_result.get("application_guidance", ""),
            ai_result.get("warning", ""),
            ai_result.get("motivational_message", ""),
        ]
        ai_text = " | ".join(p for p in parts if p)
    else:
        ai_text = f"Found {len(eligible_schemes)} eligible schemes. Total subsidy: Rs.{total_subsidy:,.0f}."

    doc = {
        "user_id": ObjectId(user_id),
        "farmer_name": farmer.get("farmer_name"),
        "age": farmer.get("age"),
        "gender": farmer.get("gender"),
        "mobile": farmer.get("mobile"),
        "state": farmer.get("state"),
        "district": farmer.get("district"),
        "village": farmer.get("village", ""),
        "category": farmer.get("category"),
        "annual_income": farmer.get("annual_income"),
        "farm_size": farmer.get("farm_size"),
        "land_ownership": farmer.get("land_ownership"),
        "crop": farmer.get("crop"),
        "irrigation_type": farmer.get("irrigation_type"),
        "pm_kisan_registered": farmer.get("pm_kisan_registered", False),
        "aadhaar_available": farmer.get("aadhaar_available", True),
        "bank_account_available": farmer.get("bank_account_available", True),
        "farmer_type": farmer.get("farmer_type"),
        "eligible_schemes": eligible_schemes,
        "total_subsidy": total_subsidy,
        "total_loan": total_loan,
        "has_insurance": has_insurance,
        "ai_recommendation": ai_text,
        "ai_details": ai_result if ai_result.get("available") else {},
        "created_at": datetime.now(timezone.utc),
    }

    db = get_db()
    result = await db[GOVERNMENT_REPORTS_COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return government_report_to_dict(doc)


async def get_reports(user_id: str, params: dict) -> dict:
    db = get_db()
    query = {"user_id": ObjectId(user_id)}

    q = params.get("q")
    if q:
        query["$or"] = [
            {"farmer_name": {"$regex": q, "$options": "i"}},
            {"state": {"$regex": q, "$options": "i"}},
            {"crop": {"$regex": q, "$options": "i"}},
        ]
    if params.get("state"):
        query["state"] = {"$regex": params["state"], "$options": "i"}
    if params.get("crop"):
        query["crop"] = {"$regex": params["crop"], "$options": "i"}
    if params.get("farmer_type"):
        query["farmer_type"] = params["farmer_type"]

    page = max(1, int(params.get("page", 1)))
    limit = min(50, int(params.get("limit", 10)))
    skip = (page - 1) * limit

    total = await db[GOVERNMENT_REPORTS_COLLECTION].count_documents(query)
    cursor = db[GOVERNMENT_REPORTS_COLLECTION].find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = [government_report_to_dict(d) async for d in cursor]

    return {"data": docs, "total": total, "page": page, "limit": limit}


async def get_report(report_id: str, user_id: str) -> dict | None:
    db = get_db()
    try:
        doc = await db[GOVERNMENT_REPORTS_COLLECTION].find_one(
            {"_id": ObjectId(report_id), "user_id": ObjectId(user_id)}
        )
    except Exception:
        return None
    return government_report_to_dict(doc) if doc else None


async def delete_report(report_id: str, user_id: str) -> bool:
    db = get_db()
    try:
        result = await db[GOVERNMENT_REPORTS_COLLECTION].delete_one(
            {"_id": ObjectId(report_id), "user_id": ObjectId(user_id)}
        )
        return result.deleted_count > 0
    except Exception:
        return False


async def get_stats(user_id: str) -> dict:
    db = get_db()
    total = await db[GOVERNMENT_REPORTS_COLLECTION].count_documents({"user_id": ObjectId(user_id)})
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id)}},
        {"$group": {"_id": None, "avg_subsidy": {"$avg": "$total_subsidy"}, "total_subsidy": {"$sum": "$total_subsidy"}}},
    ]
    agg = await db[GOVERNMENT_REPORTS_COLLECTION].aggregate(pipeline).to_list(1)
    avg_subsidy = round(agg[0]["avg_subsidy"], 0) if agg else 0
    total_subsidy = round(agg[0]["total_subsidy"], 0) if agg else 0
    return {"total_reports": total, "avg_subsidy": avg_subsidy, "total_subsidy": total_subsidy}
