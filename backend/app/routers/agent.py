from datetime import datetime, timezone
from fastapi import APIRouter

from app.schemas.soil_schema import SoilReportResponse
from app.services import soil_service

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.get("/health")
async def health():
    return {
        "agent":      "Soil Intelligence Agent",
        "version":    "2.0.0",
        "status":     "active",
        "capabilities": ["image-soil-analysis", "crop-recommendation", "fertilizer-recommendation", "yield-prediction"],
        "connectedAgents": [],
        "timestamp":  datetime.now(timezone.utc).isoformat(),
    }


@router.get("/soil-context/{report_id}", response_model=SoilReportResponse)
async def soil_context(report_id: str):
    context = await soil_service.get_agent_context(report_id)
    return {"success": True, "agentContext": context}
