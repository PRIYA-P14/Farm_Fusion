"""Authentication middleware."""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # TODO: Implement JWT token validation
        response = await call_next(request)
        return response
