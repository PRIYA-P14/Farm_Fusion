"""
crop_health_demo.py
Command-line demo for the Crop Health Agent.
Tests the full pipeline without needing the FastAPI server.

Usage:
    python crop_health_demo.py                        # uses a sample image path
    python crop_health_demo.py path/to/leaf.jpg Tomato
"""

import json
import os
import sys

from predict import is_model_available


def demo_with_model(image_path: str, crop_name: str) -> None:
    """Run the full agent pipeline on a real image file."""
    from crop_health_agent import CropHealthAgent

    if not os.path.exists(image_path):
        print(f"[ERROR] Image not found: {image_path}")
        sys.exit(1)

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    agent = CropHealthAgent()
    result = agent.run(image_bytes=image_bytes, crop_name=crop_name)
    print(json.dumps(result, indent=2))


def demo_without_model() -> None:
    """
    Demonstrate the disease database and agent logic without a trained model.
    Useful for verifying the setup before training.
    """
    from disease_database import DISEASE_DATABASE, CLASS_LABELS

    print("=" * 60)
    print("  Crop Health Agent — Demo (no model required)")
    print("=" * 60)

    print(f"\n[INFO] Supported disease classes ({len(CLASS_LABELS)}):")
    for label in CLASS_LABELS:
        info = DISEASE_DATABASE.get(label, {})
        print(f"  • {label:40s} → {info.get('disease_name', 'N/A')}")

    print("\n[INFO] Sample disease entry — Tomato Early Blight:")
    entry = DISEASE_DATABASE.get("Tomato___Early_Blight", {})
    print(json.dumps(entry, indent=2))

    print("\n[INFO] Model status:", "✅ Ready" if is_model_available() else "❌ Not trained yet")
    if not is_model_available():
        print("       Run 'python train_model.py' after downloading the PlantVillage dataset.")


if __name__ == "__main__":
    if len(sys.argv) == 3:
        image_path_arg = sys.argv[1]
        crop_arg = sys.argv[2]
        if not is_model_available():
            print("[WARN] Model not found. Running database demo instead.\n")
            demo_without_model()
        else:
            demo_with_model(image_path_arg, crop_arg)
    else:
        demo_without_model()
