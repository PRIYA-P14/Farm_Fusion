# Crop Health Agent
Agent #5 of **AgriVerse AI – Multi-Agent Smart Farming Assistant**

## What it does
| Responsibility | Where it's implemented |
|---|---|
| Detect crop disease from leaf image | `agent.detect_disease()` |
| Return confidence score | `predict.py` → `confidence` field |
| Detect nutrient deficiency | `agent.detect_nutrient_deficiency()` |
| Recommend treatment | `agent.recommend_treatment()` |
| Recommend fertilizer | `agent.recommend_fertilizer()` |
| Recommend pesticide | `agent.recommend_pesticide()` |
| Predict disease spread risk | `agent.predict_spread()` |
| Detect healthy plants | CNN class `*___Healthy` |
| Prevention tips | `agent.get_prevention_tips()` |

## Project Structure
```
Crop_Health_Agent/
├── crop_health_agent.py   # Main agent class
├── crop_health_api.py     # FastAPI microservice (port 8005)
├── crop_health_demo.py    # CLI demo (no server needed)
├── crop_health_data.py    # (reserved for future data utilities)
├── cnn_model.py           # CNN architecture (TensorFlow/Keras)
├── train_model.py         # Training pipeline
├── predict.py             # Inference module
├── disease_database.py    # Full disease knowledge base
├── image_utils.py         # Image preprocessing (resize, normalize)
├── requirements.txt
├── README.md
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── uploads/               # Saved uploaded images
├── dataset/
│   └── PlantVillage/      # Place dataset here
└── models/
    └── crop_disease_model.keras  # Saved after training
```

## Supported Diseases
| Crop | Diseases |
|---|---|
| Tomato | Early Blight, Late Blight, Healthy |
| Potato | Early Blight, Late Blight, Healthy |
| Corn | Common Rust, Northern Leaf Blight, Healthy |
| Apple | Scab, Black Rot, Healthy |
| Grape | Black Rot, Healthy |
| Pepper | Bacterial Spot, Healthy |

## CNN Architecture
```
Input (224×224×3)
→ Conv2D(32) → ReLU → MaxPool
→ Conv2D(64) → ReLU → MaxPool
→ Conv2D(128) → ReLU → MaxPool
→ Flatten
→ Dense(256) → Dropout(0.5)
→ Dense(16, Softmax)
```
- Loss: `categorical_crossentropy`
- Optimizer: `Adam (lr=0.001)`
- Metric: `Accuracy`

## Installation
```bash
cd Crop_Health_Agent
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

## Dataset
Download the PlantVillage dataset from Kaggle:
```
https://www.kaggle.com/datasets/emmarex/plantdisease
```
Extract and place it at:
```
Crop_Health_Agent/dataset/PlantVillage/<ClassName>/
```
Each class folder name must match the labels in `disease_database.py`:
```
Tomato___Early_Blight/
Tomato___Late_Blight/
Tomato___Healthy/
Potato___Early_Blight/
...
```

## Training
```bash
python train_model.py
```
- Splits dataset 80% train / 20% validation
- Saves best model to `models/crop_disease_model.keras`
- Uses EarlyStopping and ReduceLROnPlateau callbacks

## Demo (no server needed)
```bash
python crop_health_demo.py                          # shows disease DB
python crop_health_demo.py leaf.jpg Tomato          # full prediction
```

## Run as Microservice
```bash
uvicorn crop_health_api:app --reload --port 8005
```
Open **http://127.0.0.1:8005/docs** for Swagger UI.

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check + model status |
| GET | `/healthy` | Liveness probe |
| GET | `/diseases` | List all supported diseases |
| GET | `/classes` | List CNN class labels |
| POST | `/upload` | Upload and save a leaf image |
| POST | `/predict` | Predict disease from leaf image |

### Example curl
```bash
curl -X POST http://127.0.0.1:8005/predict \
  -F "file=@leaf.jpg" \
  -F "crop=Tomato"
```

### Example Response
```json
{
  "crop": "Tomato",
  "disease": "Early Blight",
  "confidence": 98.34,
  "nutrient_deficiency": "Potassium Deficiency",
  "fertilizer": "Balanced NPK (19:19:19)...",
  "treatment": "Remove infected leaves. Apply fungicide...",
  "organic_treatment": "Spray neem oil (5ml/L)...",
  "chemical_treatment": "Mancozeb 75 WP @ 2g/L...",
  "pesticide": "Mancozeb 75 WP, Chlorothalonil 75 WP",
  "prevention": ["Use certified disease-free seeds.", "..."],
  "spread_risk": "Medium",
  "urgency": "MEDIUM — Apply treatment within 3 days.",
  "symptoms": ["Dark brown circular spots...", "..."],
  "scientific_name": "Alternaria solani",
  "recovery_time_days": 14
}
```

## Plugging into the Multi-Agent System
This agent exposes the same interface pattern as the Market Price Agent:
- `agent.run(image_bytes, crop_name)` → returns combined JSON
- FastAPI on port **8005** (Market Agent runs on **8004**)

The orchestrator calls `/predict` on this agent when a farmer reports
leaf symptoms or uploads a photo, then merges the response with other
agents' outputs into one combined answer.
