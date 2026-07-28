from typing import Optional, Any
from pydantic import BaseModel


class SoilReportResponse(BaseModel):
    """Generic API response wrapper."""
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    total: Optional[int] = None
    page: Optional[int] = None
    pages: Optional[int] = None
