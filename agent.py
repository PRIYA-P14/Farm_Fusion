"""
MarketPriceAgent  (Agent #4 of AgriVerse AI - Multi-Agent Smart Farming Assistant)

Responsibilities:
  1. Collect market prices
  2. Predict future price trends (next 7 days)
  3. Recommend the best selling time
  4. Suggest nearby markets
  5. Estimate profit

Can be used directly (see demo.py) or through the FastAPI wrapper (api.py)
so it can later be plugged into the team's multi-agent orchestrator.
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import timedelta
from math import radians, sin, cos, sqrt, atan2

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

from data import MARKETS, generate_historical_prices


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    """Straight-line distance between two lat/lon points, in km."""
    R = 6371.0
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


@dataclass
class MarketPriceAgent:
    name: str = "Market Price Prediction Agent"

    # ---------- 1. Collect market prices ----------
    def get_current_price(self, crop: str, market: str) -> dict:
        df = generate_historical_prices(crop, market)
        latest = df.iloc[-1]
        return {
            "crop": crop,
            "market": market,
            "date": str(latest["date"]),
            "price_per_quintal": float(latest["price"]),
        }

    # ---------- 2. Predict future price trend ----------
    def predict_next_week(self, crop: str, market: str) -> dict:
        df = generate_historical_prices(crop, market).reset_index(drop=True)
        df["day_index"] = np.arange(len(df))
        df["day_of_week"] = pd.to_datetime(df["date"]).dt.dayofweek
        df["rolling_avg_7"] = df["price"].rolling(7, min_periods=1).mean()

        X = df[["day_index", "day_of_week", "rolling_avg_7"]]
        y = df["price"]
        model = LinearRegression()
        model.fit(X, y)

        last_index = df["day_index"].iloc[-1]
        last_date = pd.to_datetime(df["date"].iloc[-1])
        rolling = df["rolling_avg_7"].iloc[-1]

        future_rows = []
        for i in range(1, 8):
            day_index = last_index + i
            date = last_date + timedelta(days=i)
            dow = date.dayofweek
            X_next = pd.DataFrame([[day_index, dow, rolling]], columns=["day_index", "day_of_week", "rolling_avg_7"])
            pred = float(model.predict(X_next)[0])
            pred = max(pred, 0.0)
            future_rows.append({"date": date.date().isoformat(), "predicted_price": round(pred, 2)})
            rolling = (rolling * 6 + pred) / 7  # keep rolling avg feature updated

        current_price = float(df["price"].iloc[-1])
        expected_next_week = future_rows[-1]["predicted_price"]
        pct_change = round((expected_next_week - current_price) / current_price * 100, 2)

        return {
            "crop": crop,
            "market": market,
            "current_price": round(current_price, 2),
            "forecast_7_days": future_rows,
            "expected_price_next_week": expected_next_week,
            "expected_change_percent": pct_change,
        }

    # ---------- 3. Recommend best selling time ----------
    def recommend_best_selling_time(self, crop: str, market: str) -> dict:
        forecast = self.predict_next_week(crop, market)
        best_day = max(forecast["forecast_7_days"], key=lambda d: d["predicted_price"])
        current_price = forecast["current_price"]

        if best_day["predicted_price"] > current_price * 1.02:
            advice = f"Wait and sell on {best_day['date']} for a better price."
        elif best_day["predicted_price"] < current_price * 0.98:
            advice = "Prices are expected to fall this week. Sell today for the best return."
        else:
            advice = "Prices are expected to stay stable. Selling any day this week is fine."

        return {
            "crop": crop,
            "market": market,
            "recommended_selling_date": best_day["date"],
            "expected_price_on_that_date": best_day["predicted_price"],
            "advice": advice,
        }

    # ---------- 4. Suggest nearby markets ----------
    def suggest_nearby_markets(self, crop: str, farmer_lat: float, farmer_lon: float, top_n: int = 3) -> list[dict]:
        results = []
        for market, (lat, lon, state) in MARKETS.items():
            distance = round(_haversine_km(farmer_lat, farmer_lon, lat, lon), 1)
            price_info = self.get_current_price(crop, market)
            results.append({
                "market": market,
                "state": state,
                "distance_km": distance,
                "price_per_quintal": price_info["price_per_quintal"],
            })
        # simple ranking: favour higher price, penalise distance
        results.sort(key=lambda r: (-r["price_per_quintal"] / 100 + r["distance_km"] / 20))
        return results[:top_n]

    # ---------- 5. Estimate profit ----------
    def estimate_profit(self, crop: str, market: str, quantity_kg: float, cost_price_per_kg: float) -> dict:
        current = self.get_current_price(crop, market)
        forecast = self.predict_next_week(crop, market)

        current_price_per_kg = current["price_per_quintal"] / 100
        expected_price_per_kg = forecast["expected_price_next_week"] / 100

        revenue_now = round(current_price_per_kg * quantity_kg, 2)
        revenue_next_week = round(expected_price_per_kg * quantity_kg, 2)
        cost = round(cost_price_per_kg * quantity_kg, 2)

        return {
            "crop": crop,
            "market": market,
            "quantity_kg": quantity_kg,
            "total_cost": cost,
            "revenue_if_sold_today": revenue_now,
            "profit_if_sold_today": round(revenue_now - cost, 2),
            "revenue_if_sold_next_week": revenue_next_week,
            "profit_if_sold_next_week": round(revenue_next_week - cost, 2),
        }

    # ---------- Combined run (what the orchestrator/other agents will call) ----------
    def run(self, query: dict) -> dict:
        """
        query = {
          "crop": "Onion",
          "market": "Erode Market",
          "quantity_kg": 500,          # optional, default 100
          "cost_price_per_kg": 12,     # optional, default 0
          "farmer_lat": 11.38,         # optional -> enables nearby_markets
          "farmer_lon": 77.89          # optional -> enables nearby_markets
        }
        """
        crop = query["crop"]
        market = query["market"]
        quantity_kg = query.get("quantity_kg", 100)
        cost_price_per_kg = query.get("cost_price_per_kg", 0)
        farmer_lat = query.get("farmer_lat")
        farmer_lon = query.get("farmer_lon")

        current = self.get_current_price(crop, market)
        forecast = self.predict_next_week(crop, market)
        selling_advice = self.recommend_best_selling_time(crop, market)
        profit = self.estimate_profit(crop, market, quantity_kg, cost_price_per_kg)

        nearby = None
        if farmer_lat is not None and farmer_lon is not None:
            nearby = self.suggest_nearby_markets(crop, farmer_lat, farmer_lon)

        return {
            "agent": self.name,
            "current_price": current,
            "forecast": forecast,
            "selling_recommendation": selling_advice,
            "profit_estimation": profit,
            "nearby_markets": nearby,
        }
