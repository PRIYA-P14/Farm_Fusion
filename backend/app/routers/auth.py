"""
Auth router — register, login, Google OAuth, profile.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
import httpx

from app.schemas.auth_schema import RegisterRequest, LoginRequest, TokenResponse, AuthResponse
from app.services import auth_service
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_CLIENT_ID = "719669467104-9t27sct0euogkh6n3gv9966d24csle90.apps.googleusercontent.com"
GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest):
    user = await auth_service.register(body.model_dump())
    return {"success": True, "data": user, "message": "Registration successful"}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    result = await auth_service.login(body.email, body.password)
    return {"success": True, "token": result["token"], "user": result["user"]}


@router.post("/google", response_model=TokenResponse)
async def google_login(body: dict):
    credential = body.get("credential", "")
    if not credential:
        raise HTTPException(status_code=400, detail="Missing credential")

    # Verify token with Google's tokeninfo endpoint (async, no extra deps)
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(GOOGLE_TOKEN_INFO_URL, params={"id_token": credential})

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    info = resp.json()

    # Verify the token was issued for our app
    if info.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Token audience mismatch")

    email    = info.get("email", "")
    fullname = info.get("name", email.split("@")[0])

    if not email:
        raise HTTPException(status_code=401, detail="No email in Google token")

    db   = get_db()
    user = await db["users"].find_one({"email": email})
    if not user:
        doc = {
            "fullName":     fullname,
            "mobileNumber": "",
            "email":        email,
            "passwordHash": "",
            "createdAt":    datetime.now(timezone.utc),
        }
        inserted = await db["users"].insert_one(doc)
        user     = await db["users"].find_one({"_id": inserted.inserted_id})

    token = auth_service._create_token(str(user["_id"]))
    return {"success": True, "token": token, "user": auth_service._serialize_user(user)}


@router.get("/profile", response_model=AuthResponse)
async def profile(current_user: dict = Depends(auth_service.get_current_user)):
    return {"success": True, "data": current_user}
