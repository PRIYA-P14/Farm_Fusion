"""Response schemas for API endpoints."""

from pydantic import BaseModel


class AgentResponse(BaseModel):
    agent_name: str
    query: str
    response: str
    confidence: float | None = None
    metadata: dict | None = None


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
    status_code: int


class SuccessResponse(BaseModel):
    message: str
    data: dict | None = None
