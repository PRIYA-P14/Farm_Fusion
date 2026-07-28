from datetime import datetime, timezone
from bson import ObjectId


def government_report_to_dict(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    if "user_id" in doc:
        doc["user_id"] = str(doc["user_id"])
    return doc


GOVERNMENT_REPORTS_COLLECTION = "government_reports"
