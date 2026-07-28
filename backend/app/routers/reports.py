"""
Reports router — manual soil input, image upload, CRUD, all protected by JWT.
"""
import base64
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import Optional

from app.schemas.soil_schema import SoilReportResponse
from app.services import soil_service
from app.services.auth_service import get_current_user
from app.agents.image_agent import analyse_soil_image
from app.config import settings
import os, uuid

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/upload-image")
async def upload_image(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Stage 1: Receive image, run vision analysis, return results + base64 for stage 2."""
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if image.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP images are supported")

    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10MB")

    # Save temporarily for OpenCV processing
    ext = image.filename.rsplit(".", 1)[-1].lower() if "." in image.filename else "jpg"
    tmp_path = os.path.join(settings.UPLOAD_DIR, f"tmp_{uuid.uuid4().hex}.{ext}")
    with open(tmp_path, "wb") as f:
        f.write(contents)

    try:
        result = await analyse_soil_image(tmp_path, {})
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    if result.get("rejected"):
        raise HTTPException(status_code=422, detail=result.get("rejectionReason", "Not a soil image"))

    mime = image.content_type or "image/jpeg"
    b64  = base64.b64encode(contents).decode()

    return {
        "success":      True,
        "imageAnalysis": result,
        "imageData":    b64,
        "mimeType":     mime,
    }


@router.post("/analyse-with-image", response_model=SoilReportResponse, status_code=201)
async def analyse_with_image(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Stage 2: Receive form values + imageAnalysis, run full pipeline, save report."""
    report = await soil_service.create_report_from_image_form(payload, current_user)
    return {"success": True, "data": report}


@router.post("", response_model=SoilReportResponse, status_code=201)
async def create_report(
    soil_data: dict,
    current_user: dict = Depends(get_current_user),
):
    report = await soil_service.create_report_from_manual(soil_data, current_user)
    return {"success": True, "data": report}


@router.get("", response_model=SoilReportResponse)
async def get_reports(
    search: str = None, page: int = 1, limit: int = 10,
    current_user: dict = Depends(get_current_user),
):
    result = await soil_service.get_reports(user_id=current_user["id"], search=search, page=page, limit=limit)
    return {"success": True, **result}


@router.get("/{report_id}", response_model=SoilReportResponse)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = await soil_service.get_report(report_id, current_user["id"])
    return {"success": True, "data": report}


@router.delete("/{report_id}", response_model=SoilReportResponse)
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    await soil_service.delete_report(report_id, current_user["id"])
    return {"success": True, "message": "Report deleted"}
