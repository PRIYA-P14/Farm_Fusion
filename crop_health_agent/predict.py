"""
predict.py
Prediction module for the Crop Health Agent.
Loads the saved CNN model and runs inference on a preprocessed image.
"""

import os
from typing import Dict, Any

import numpy as np

from disease_database import CLASS_LABELS, DISEASE_DATABASE
from image_utils import preprocess_image_bytes, preprocess_image_path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "crop_disease_model.keras")

# Lazy-loaded model singleton — loaded once on first prediction call
_model = None


def _get_model():
    """Load and cache the Keras model."""
    global _model
    if _model is None:
        from cnn_model import load_model
        _model = load_model(MODEL_PATH)
    return _model


def predict_from_bytes(image_bytes: bytes) -> Dict[str, Any]:
    """
    Run disease prediction on raw image bytes.

    Args:
        image_bytes: Raw bytes of the uploaded image.

    Returns:
        Dictionary with predicted class label, disease name, and confidence.

    Raises:
        FileNotFoundError: If the model has not been trained yet.
        ValueError: If the image cannot be decoded.
    """
    model = _get_model()
    img_array = preprocess_image_bytes(image_bytes)
    predictions = model.predict(img_array, verbose=0)  # shape: (1, NUM_CLASSES)
    return _build_result(predictions)


def predict_from_path(image_path: str) -> Dict[str, Any]:
    """
    Run disease prediction on an image file path.

    Args:
        image_path: Path to the image file.

    Returns:
        Dictionary with predicted class label, disease name, and confidence.
    """
    model = _get_model()
    img_array = preprocess_image_path(image_path)
    predictions = model.predict(img_array, verbose=0)
    return _build_result(predictions)


def _build_result(predictions: np.ndarray) -> Dict[str, Any]:
    """
    Convert raw model output probabilities into a structured result dict.

    Args:
        predictions: NumPy array of shape (1, NUM_CLASSES).

    Returns:
        Structured prediction result.
    """
    probs = predictions[0]
    top_idx = int(np.argmax(probs))
    confidence = float(round(probs[top_idx] * 100, 2))
    class_label = CLASS_LABELS[top_idx]

    # Top-3 predictions for transparency
    top3_indices = np.argsort(probs)[::-1][:3]
    top3 = [
        {"label": CLASS_LABELS[i], "confidence": float(round(probs[i] * 100, 2))}
        for i in top3_indices
    ]

    disease_info = DISEASE_DATABASE.get(class_label, {})

    return {
        "class_label": class_label,
        "disease_name": disease_info.get("disease_name", class_label),
        "confidence": confidence,
        "top3_predictions": top3,
    }


def is_model_available() -> bool:
    """Return True if the trained model file exists on disk."""
    return os.path.exists(MODEL_PATH)
