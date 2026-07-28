"""
User model for MongoDB users collection.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserModel(BaseModel):
    fullName: str
    mobileNumber: str
    email: str
    passwordHash: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class UserPublic(BaseModel):
    """Safe user data returned to client (no password)."""
    id: str
    fullName: str
    mobileNumber: str
    email: str
    createdAt: str
