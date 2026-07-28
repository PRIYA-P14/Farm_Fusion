"""
crop_health_api.py
FastAPI microservice for the Crop Health Agent.

Run with:
    uvicorn crop_health_api:app --reload --port 8005

Open http://127.0.0.1:8005/docs for interactive Swagger UI.
"""

import os
import uuid
from typing import List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from crop_health_agent import CropHealthAgent
from disease_database import DISEASE_DATABASE, CLASS_LABELS
from predict import is_model_available

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Crop Health Agent",
    description="AI-powered crop disease detection from leaf images.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = CropHealthAgent()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_MB = 10


# ── Helpers ──────────────────────────────────────────────────────────────────
def _validate_image(file: UploadFile) -> None:
    """Raise HTTPException if the uploaded file is not a valid image."""
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}",
        )


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/", summary="Health check")
def root():
    return {
        "agent": "Crop Health Agent",
        "status": "running",
        "model_ready": is_model_available(),
    }


@app.get("/healthy", summary="Liveness probe")
def healthy():
    return {"status": "ok"}


@app.get("/diseases", summary="List all supported diseases")
def list_diseases():
    return {
        "total": len(DISEASE_DATABASE),
        "diseases": [
            {
                "id": k,
                "name": v["disease_name"],
                "crop": v["crop"],
                "spread_risk": v["spread_risk"],
            }
            for k, v in DISEASE_DATABASE.items()
        ],
    }


@app.get("/classes", summary="List all CNN class labels")
def list_classes():
    return {"classes": CLASS_LABELS}


@app.post("/upload", summary="Upload a leaf image and save it")
async def upload_image(file: UploadFile = File(...)):
    """Save the uploaded image to the uploads/ folder and return the saved path."""
    _validate_image(file)
    image_bytes = await file.read()

    if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB} MB.",
        )

    ext = os.path.splitext(file.filename or ".jpg")[-1].lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, filename)

    with open(save_path, "wb") as f:
        f.write(image_bytes)

    return {"filename": filename, "saved_path": save_path, "size_bytes": len(image_bytes)}


@app.post("/predict", summary="Predict crop disease from uploaded leaf image")
async def predict(
    file: UploadFile = File(..., description="Leaf image (JPEG/PNG)"),
    crop: str = Form(..., description="Crop name, e.g. Tomato"),
):
    """
    Upload a leaf image and crop name to get a full disease diagnosis,
    treatment plan, fertilizer, pesticide, and spread risk assessment.
    """
    _validate_image(file)
    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB} MB.",
        )

    if not is_model_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Trained model not found. "
                "Run 'python train_model.py' to train the model first."
            ),
        )

    try:
        result = agent.run(image_bytes=image_bytes, crop_name=crop)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    return JSONResponse(content=result)
