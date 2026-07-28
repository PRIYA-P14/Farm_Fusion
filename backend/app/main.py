"""
FastAPI application entry point.
"""
import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import connect_db, close_db
from app.routers import reports, agent, auth
from app.routers import government_router
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Ensure uploads dir exists at module load time (needed for StaticFiles mount)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="AgriVerse — Multi-Agent Agriculture Platform", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(agent.router)
app.include_router(government_router.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Soil Intelligence Agent API v2", "timestamp": datetime.now(timezone.utc).isoformat()}
