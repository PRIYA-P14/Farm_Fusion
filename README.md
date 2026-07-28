# Soil Intelligence Agent 🌱

AI-Powered Soil Analysis & Crop Recommendation System — Built for Multi-Agent Agriculture Hackathon

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment
Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/soil_intelligence
```

### 3. Start Development
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open http://localhost:5173

---

## Features
- 🧪 Complete soil nutrient analysis (N, P, K, pH, EC, OC)
- 🌾 Top 5 crop recommendations with yield prediction
- 💧 Irrigation planning and water requirement
- 🌱 Chemical, organic, biofertilizer recommendations
- 📋 5-tier action plan (Immediate → Long-term)
- ⚠️ Risk analysis and smart alerts
- 📊 Interactive dashboard with charts
- 🌍 English + Tamil language support
- 🎙️ Voice input and voice output
- 📄 PDF, CSV, Print export
- 🤖 Multi-agent ready REST API

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reports | Create & analyse report |
| GET | /api/reports | List reports (search, filter, paginate) |
| GET | /api/reports/:id | Get single report |
| DELETE | /api/reports/:id | Delete report |
| POST | /api/reports/analyse | Analyse without saving |
| GET | /api/reports/export/csv | Export all as CSV |
| GET | /api/agent/health | Agent health check |
| GET | /api/agent/soil-context/:id | Inter-agent context payload |

## Multi-Agent Architecture
This agent exposes `/api/agent/soil-context/:id` which returns a clean JSON payload
ready for consumption by:
- Weather Agent
- Market Price Agent
- Government Scheme Agent
- Disease Detection Agent
- Master Decision Agent
