"""
image_utils.py
Image preprocessing utilities for the Crop Health Agent.
Handles resizing, normalization, and format conversion for CNN input.
"""

import io
from typing import Optional

import cv2
import numpy as np


IMAGE_SIZE: int = 224  # CNN input size (224x224x3)


def preprocess_image_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Accept raw image bytes (from file upload), decode, resize to 224x224,
    convert to RGB, normalize to [0, 1], and return a (1, 224, 224, 3) array
    ready for model.predict().

    Args:
        image_bytes: Raw bytes of the uploaded image file.

    Returns:
        NumPy array of shape (1, 224, 224, 3) with float32 values in [0, 1].

    Raises:
        ValueError: If the image cannot be decoded.
    """
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise ValueError("Could not decode image. Ensure the file is a valid JPEG or PNG.")

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    img_normalized = img_resized.astype(np.float32) / 255.0
    return np.expand_dims(img_normalized, axis=0)  # shape: (1, 224, 224, 3)


def preprocess_image_path(image_path: str) -> np.ndarray:
    """
    Load an image from a file path, preprocess, and return model-ready array.

    Args:
        image_path: Absolute or relative path to the image file.

    Returns:
        NumPy array of shape (1, 224, 224, 3) with float32 values in [0, 1].

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the image cannot be decoded.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise FileNotFoundError(f"Image not found or cannot be read: {image_path}")

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    img_normalized = img_resized.astype(np.float32) / 255.0
    return np.expand_dims(img_normalized, axis=0)


def decode_image_for_display(image_bytes: bytes) -> Optional[np.ndarray]:
    """
    Decode image bytes to a BGR NumPy array for display or debugging.

    Args:
        image_bytes: Raw bytes of the image.

    Returns:
        BGR NumPy array or None if decoding fails.
    """
    np_arr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
