# API Reference

## Base URL
`http://localhost:8000`

## Endpoints

### Health
- `GET /health/` — Service health check

### Agents
- `GET /agents/` — List all agents
- `POST /agents/query` — Query a specific agent
- `POST /agents/query/all` — Broadcast to all agents

### Weather
- `GET /weather/current?location=` — Current weather
- `GET /weather/forecast?location=&days=` — Forecast
- `GET /weather/advisory?location=` — Farming advisory

### Crops
- `POST /crops/recommend` — Crop recommendations
- `POST /crops/disease` — Disease detection
- `GET /crops/yield` — Yield prediction

### Market
- `GET /market/prices?crop_name=&state=` — Market prices
- `GET /market/forecast?crop_name=` — Price forecast
- `GET /market/best-market?crop_name=&location=` — Best market
