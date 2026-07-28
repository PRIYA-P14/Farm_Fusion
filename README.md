# Market Price Prediction Agent
Agent #4 of **AgriVerse AI – Multi-Agent Smart Farming Assistant**

## What it does
| Requirement | Where it's implemented |
|---|---|
| Collect market prices | `agent.get_current_price()` |
| Predict future price trends | `agent.predict_next_week()` |
| Recommend best selling time | `agent.recommend_best_selling_time()` |
| Suggest nearby markets | `agent.suggest_nearby_markets()` |
| Current price | in every response, `current_price` |
| Expected price next week | `forecast.expected_price_next_week` |
| Profit estimation | `agent.estimate_profit()` |

## Project structure
```
market_price_agent/
├── data.py          # mock crops/markets + synthetic historical price generator
├── agent.py         # MarketPriceAgent class (all core logic)
├── api.py           # FastAPI wrapper (turns the agent into a microservice)
├── demo.py          # simple command-line demo
├── requirements.txt
└── README.md
```

## How the prediction actually works
1. `data.py` simulates ~120 days of historical mandi prices per (crop, market)
   using a base price + a monthly trend + weekly seasonality + noise. **This
   is the piece you swap for a real API** (e.g. data.gov.in Agmarknet) —
   just make `generate_historical_prices()` return a DataFrame with
   `date` and `price` columns from real data instead.
2. `agent.predict_next_week()` engineers 3 features (day index, day of week,
   7-day rolling average) and fits a `scikit-learn` `LinearRegression` model
   on the historical prices, then predicts the next 7 days one step at a time.
3. The best predicted day becomes the "recommended selling date".
4. `suggest_nearby_markets()` uses the haversine formula to rank markets by
   a mix of distance and price.

## Setup (VS Code)
```bash
cd market_price_agent
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

## Run the demo (no server needed)
```bash
python demo.py
```
Prints a JSON object with current price, 7-day forecast, selling advice,
profit estimate, and nearby markets.

## Run as a microservice (for the multi-agent system)
```bash
uvicorn api:app --reload --port 8004
```
Open **http://127.0.0.1:8004/docs** for an interactive Swagger UI, or call it:
```bash
curl -X POST http://127.0.0.1:8004/predict \
  -H "Content-Type: application/json" \
  -d '{"crop":"Onion","market":"Erode Market","quantity_kg":500,"cost_price_per_kg":12,"farmer_lat":11.3814,"farmer_lon":77.8949}'
```

## Plugging this into the 6-agent multi-agent system
Each teammate's agent should expose the same shape: a `run(query: dict) -> dict`
method (already done here) and, ideally, a FastAPI wrapper on its own port
(8001, 8002, 8003... one per agent). Your orchestrator/coordinator agent then:
1. Decides which agent(s) a farmer's request needs (e.g. "should I sell my
   onions now?" → calls this agent's `/predict`).
2. Calls each relevant agent's endpoint (or imports its `agent.py` directly
   if running in one process).
3. Merges the JSON responses from all agents into one combined answer for
   the farmer — that merge step is your multi-agent layer.

Available crops: Wheat, Rice, Tomato, Onion, Potato, Cotton, Maize, Soybean
Available markets: Erode, Salem, Coimbatore, Namakkal, Tiruchengode, Karur,
Madurai, Bangalore Market
