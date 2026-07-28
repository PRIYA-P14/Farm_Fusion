"""
Government Scheme & Subsidy Agent Router.
"""
import io
import csv
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.schemas.government_schema import FarmerInput, SoilContextInput
from app.services import government_service, auth_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/government", tags=["government"])


@router.post("/analyse", status_code=201)
async def analyse(
    body: FarmerInput,
    current_user: dict = Depends(auth_service.get_current_user),
):
    result = await government_service.analyse_and_save(body.model_dump(), current_user["id"])
    return {"success": True, "data": result}


@router.get("/reports")
async def list_reports(
    q: str = Query(None),
    state: str = Query(None),
    crop: str = Query(None),
    farmer_type: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(auth_service.get_current_user),
):
    params = {"q": q, "state": state, "crop": crop, "farmer_type": farmer_type, "page": page, "limit": limit}
    result = await government_service.get_reports(current_user["id"], params)
    return {"success": True, **result}


@router.get("/reports/export/csv")
async def export_csv(current_user: dict = Depends(auth_service.get_current_user)):
    result = await government_service.get_reports(current_user["id"], {"page": 1, "limit": 1000})
    reports = result["data"]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Farmer Name", "State", "District", "Crop", "Farmer Type",
                     "Annual Income", "Farm Size", "Eligible Schemes", "Total Subsidy",
                     "Total Loan", "Has Insurance", "Created At"])
    for r in reports:
        writer.writerow([
            r.get("id"), r.get("farmer_name"), r.get("state"), r.get("district"),
            r.get("crop"), r.get("farmer_type"), r.get("annual_income"), r.get("farm_size"),
            len(r.get("eligible_schemes", [])), r.get("total_subsidy"), r.get("total_loan"),
            r.get("has_insurance"), r.get("created_at"),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=government_reports.csv"},
    )


@router.get("/stats")
async def stats(current_user: dict = Depends(auth_service.get_current_user)):
    result = await government_service.get_stats(current_user["id"])
    return {"success": True, "data": result}


@router.get("/reports/{report_id}")
async def get_report(
    report_id: str,
    current_user: dict = Depends(auth_service.get_current_user),
):
    report = await government_service.get_report(report_id, current_user["id"])
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "data": report}


@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: str,
    current_user: dict = Depends(auth_service.get_current_user),
):
    deleted = await government_service.delete_report(report_id, current_user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "message": "Report deleted"}


@router.post("/from-soil")
async def from_soil(body: SoilContextInput):
    """
    Multi-agent endpoint: accepts soil context from Soil Intelligence Agent.
    Stored for future integration — does not trigger analysis yet.
    """
    return {
        "success": True,
        "message": "Soil context received. Use /api/government/analyse with full farmer profile to get scheme recommendations.",
        "received": body.model_dump(),
    }


@router.get("/health")
async def health():
    schemes = government_service._load_schemes()
    return {"status": "ok", "agent": "Government Scheme & Subsidy Agent", "schemes_loaded": len(schemes)}
