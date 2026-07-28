"""
cnn_model.py
CNN architecture definition for crop disease classification.
Architecture: Conv2D → ReLU → MaxPool → Conv2D → ReLU → MaxPool →
              Conv2D → ReLU → Flatten → Dense → Dropout → Dense(Softmax)
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.optimizers import Adam

from disease_database import NUM_CLASSES

IMAGE_SIZE: int = 224
CHANNELS: int = 3
DROPOUT_RATE: float = 0.5
LEARNING_RATE: float = 0.001


def build_model() -> keras.Model:
    """
    Build and compile the CNN model.

    Returns:
        Compiled Keras model ready for training or inference.
    """
    model = models.Sequential([
        # Input
        layers.Input(shape=(IMAGE_SIZE, IMAGE_SIZE, CHANNELS)),

        # Block 1: Conv → ReLU → MaxPool
        layers.Conv2D(32, (3, 3), padding="same"),
        layers.Activation("relu"),
        layers.MaxPooling2D((2, 2)),

        # Block 2: Conv → ReLU → MaxPool
        layers.Conv2D(64, (3, 3), padding="same"),
        layers.Activation("relu"),
        layers.MaxPooling2D((2, 2)),

        # Block 3: Conv → ReLU
        layers.Conv2D(128, (3, 3), padding="same"),
        layers.Activation("relu"),
        layers.MaxPooling2D((2, 2)),

        # Flatten
        layers.Flatten(),

        # Dense → Dropout → Softmax
        layers.Dense(256, activation="relu"),
        layers.Dropout(DROPOUT_RATE),
        layers.Dense(NUM_CLASSES, activation="softmax"),
    ], name="CropDiseaseClassifier")

    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model


def load_model(model_path: str) -> keras.Model:
    """
    Load a saved Keras model from disk.

    Args:
        model_path: Path to the .keras model file.

    Returns:
        Loaded Keras model.

    Raises:
        FileNotFoundError: If the model file does not exist.
    """
    import os
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found at '{model_path}'. "
            "Run train_model.py first to train and save the model."
        )
    return keras.models.load_model(model_path)


if __name__ == "__main__":
    m = build_model()
    m.summary()
