"""
Auth schemas — register, login, token response.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    fullName: str
    mobileNumber: str
    email: str
    password: str
    confirmPassword: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    success: bool
    token: str
    user: dict


class AuthResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None
