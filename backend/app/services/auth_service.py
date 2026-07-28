"""
Authentication service — register, login, JWT, profile.
"""
import logging
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt as _bcrypt

from app.database import get_db
from app.config import settings

logger = logging.getLogger(__name__)
COLLECTION = "users"

bearer = HTTPBearer()


def _hash(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def _verify(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def _serialize_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "fullName": doc["fullName"],
        "mobileNumber": doc["mobileNumber"],
        "email": doc["email"],
        "createdAt": doc["createdAt"].isoformat() if isinstance(doc.get("createdAt"), datetime) else str(doc.get("createdAt", "")),
    }


async def register(data: dict) -> dict:
    if data["password"] != data["confirmPassword"]:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    db = get_db()
    existing = await db[COLLECTION].find_one({"email": data["email"].lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    if not data["mobileNumber"].isdigit() or len(data["mobileNumber"]) != 10:
        raise HTTPException(status_code=400, detail="Enter valid 10-digit mobile number")

    doc = {
        "fullName": data["fullName"].strip(),
        "mobileNumber": data["mobileNumber"].strip(),
        "email": data["email"].lower().strip(),
        "passwordHash": _hash(data["password"]),
        "createdAt": datetime.now(timezone.utc),
    }
    result = await db[COLLECTION].insert_one(doc)
    created = await db[COLLECTION].find_one({"_id": result.inserted_id})
    return _serialize_user(created)


async def login(email: str, password: str) -> dict:
    db = get_db()
    user = await db[COLLECTION].find_one({"email": email.lower().strip()})
    if not user or not _verify(password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_token(str(user["_id"]))
    return {"token": token, "user": _serialize_user(user)}


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    db = get_db()
    user = await db[COLLECTION].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return _serialize_user(user)
