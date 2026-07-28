"""
train_model.py
Train the CNN on the PlantVillage dataset and save the model.

Usage:
    python train_model.py

If the PlantVillage dataset is NOT present, synthetic training data is
generated automatically so the model trains and saves without any download.
The saved model will accept real leaf images at inference time — accuracy
improves significantly once you replace synthetic data with real images.

Dataset (optional) expected at:
    dataset/PlantVillage/<ClassName>/<image>.jpg

Download from: https://www.kaggle.com/datasets/emmarex/plantdisease
"""

import os
import sys

import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.utils import to_categorical

from cnn_model import build_model, IMAGE_SIZE
from disease_database import NUM_CLASSES, CLASS_LABELS

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset", "PlantVillage")
MODEL_DIR   = os.path.join(BASE_DIR, "models")
MODEL_PATH  = os.path.join(MODEL_DIR, "crop_disease_model.keras")

# ── Hyperparameters ───────────────────────────────────────────────────────────
BATCH_SIZE       = 32
EPOCHS_REAL      = 30
EPOCHS_SYNTHETIC = 10
IMAGE_SIZE_TUPLE = (IMAGE_SIZE, IMAGE_SIZE)
VALIDATION_SPLIT = 0.2
SAMPLES_PER_CLASS_SYNTHETIC = 60


def _has_real_dataset() -> bool:
    if not os.path.isdir(DATASET_DIR):
        return False
    subfolders = [
        d for d in os.listdir(DATASET_DIR)
        if os.path.isdir(os.path.join(DATASET_DIR, d))
    ]
    return len(subfolders) > 0


def _generate_synthetic_data():
    print("[INFO] PlantVillage dataset not found.")
    print(f"[INFO] Generating synthetic training data ({SAMPLES_PER_CLASS_SYNTHETIC} images × {NUM_CLASSES} classes)…")

    rng = np.random.default_rng(42)
    X, y = [], []

    for class_idx, label in enumerate(CLASS_LABELS):
        base_color = rng.integers(30, 220, size=3).astype(np.float32)
        for _ in range(SAMPLES_PER_CLASS_SYNTHETIC):
            img = rng.normal(loc=base_color / 255.0, scale=0.08,
                             size=(IMAGE_SIZE, IMAGE_SIZE, 3)).astype(np.float32)
            img = np.clip(img, 0.0, 1.0)
            X.append(img)
            y.append(class_idx)

    X = np.array(X, dtype=np.float32)
    y_cat = to_categorical(np.array(y), num_classes=NUM_CLASSES)

    indices = rng.permutation(len(X))
    X, y_cat = X[indices], y_cat[indices]

    split = int(len(X) * (1 - VALIDATION_SPLIT))
    return X[:split], y_cat[:split], X[split:], y_cat[split:]


def _make_real_generators():
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.1,
        validation_split=VALIDATION_SPLIT,
    )
    val_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=VALIDATION_SPLIT,
    )

    print(f"[INFO] Loading real dataset from: {DATASET_DIR}")
    train_gen = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMAGE_SIZE_TUPLE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="training",
        shuffle=True,
    )
    val_gen = val_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMAGE_SIZE_TUPLE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
    )
    return train_gen, val_gen


def train() -> None:
    os.makedirs(MODEL_DIR, exist_ok=True)
    use_real = _has_real_dataset()

    model = build_model()
    model.summary()

    callbacks = [
        ModelCheckpoint(MODEL_PATH, monitor="val_accuracy", save_best_only=True, verbose=1),
        EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6, verbose=1),
    ]

    if use_real:
        train_gen, val_gen = _make_real_generators()
        print(f"[INFO] Training samples : {train_gen.samples}")
        print(f"[INFO] Validation samples: {val_gen.samples}")
        print(f"[INFO] Starting training for up to {EPOCHS_REAL} epochs…\n")
        history = model.fit(train_gen, epochs=EPOCHS_REAL, validation_data=val_gen, callbacks=callbacks)
    else:
        X_train, y_train, X_val, y_val = _generate_synthetic_data()
        print(f"[INFO] Training samples : {len(X_train)}")
        print(f"[INFO] Validation samples: {len(X_val)}")
        print(f"[INFO] Starting training for {EPOCHS_SYNTHETIC} epochs on synthetic data…\n")
        print("[NOTE] For accurate disease detection, download the PlantVillage dataset and re-run.")
        print("       https://www.kaggle.com/datasets/emmarex/plantdisease\n")
        history = model.fit(
            X_train, y_train,
            epochs=EPOCHS_SYNTHETIC,
            batch_size=BATCH_SIZE,
            validation_data=(X_val, y_val),
            callbacks=callbacks,
        )

    print(f"\n[INFO] Training complete. Model saved to: {MODEL_PATH}")
    val_acc = max(history.history.get("val_accuracy", [0]))
    print(f"[INFO] Best validation accuracy: {val_acc * 100:.2f}%")

    if not use_real:
        print("\n[REMINDER] This model was trained on synthetic data.")
        print("           Replace with PlantVillage data for real disease detection.")


if __name__ == "__main__":
    train()
