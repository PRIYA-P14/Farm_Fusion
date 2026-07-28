"""
Mock data layer for the Market Price Prediction Agent.

In production, replace `generate_historical_prices()` with a real call to a
mandi-price API (e.g. Agmarknet / data.gov.in) and replace `MARKETS` with a
real market/district database. Everything else in agent.py stays the same,
since it only depends on the DataFrame shape returned here (date, price).
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

CROPS = ["Wheat", "Rice", "Tomato", "Onion", "Potato", "Cotton", "Maize", "Soybean"]

# base price (INR/quintal), volatility, and monthly trend per crop
# used only to seed realistic-looking mock data
CROP_BASE_PRICE = {
    "Wheat":   {"base": 2200, "volatility": 40,  "trend": 3.0},
    "Rice":    {"base": 2600, "volatility": 50,  "trend": 2.0},
    "Tomato":  {"base": 1500, "volatility": 300, "trend": -5.0},
    "Onion":   {"base": 1800, "volatility": 250, "trend": 8.0},
    "Potato":  {"base": 1200, "volatility": 150, "trend": 1.0},
    "Cotton":  {"base": 6500, "volatility": 120, "trend": 5.0},
    "Maize":   {"base": 1900, "volatility": 60,  "trend": 1.5},
    "Soybean": {"base": 4200, "volatility": 100, "trend": 4.0},
}

# mock markets: name -> (lat, lon, state)
MARKETS = {
    "Erode Market":        (11.3410, 77.7172, "Tamil Nadu"),
    "Salem Market":        (11.6643, 78.1460, "Tamil Nadu"),
    "Coimbatore Market":   (11.0168, 76.9558, "Tamil Nadu"),
    "Namakkal Market":     (11.2189, 78.1677, "Tamil Nadu"),
    "Tiruchengode Market": (11.3814, 77.8949, "Tamil Nadu"),
    "Karur Market":        (10.9601, 78.0766, "Tamil Nadu"),
    "Madurai Market":      (9.9252, 78.1198, "Tamil Nadu"),
    "Bangalore Market":    (12.9716, 77.5946, "Karnataka"),
}

# each market sells slightly above/below the crop's base price
MARKET_PRICE_MULTIPLIER = {
    "Erode Market": 1.00, "Salem Market": 0.98, "Coimbatore Market": 1.03,
    "Namakkal Market": 0.95, "Tiruchengode Market": 0.97, "Karur Market": 0.99,
    "Madurai Market": 1.02, "Bangalore Market": 1.08,
}


def generate_historical_prices(crop: str, market: str, days: int = 120, seed=None) -> pd.DataFrame:
    """Returns a DataFrame with columns [date, price] for the last `days` days."""
    if crop not in CROP_BASE_PRICE:
        raise ValueError(f"Unknown crop '{crop}'. Choose from {list(CROP_BASE_PRICE)}")
    if market not in MARKETS:
        raise ValueError(f"Unknown market '{market}'. Choose from {list(MARKETS)}")

    # deterministic seed per (crop, market) so repeated calls in one "day" are stable
    rng = np.random.default_rng(seed if seed is not None else abs(hash((crop, market))) % (2**32))
    cfg = CROP_BASE_PRICE[crop]
    mult = MARKET_PRICE_MULTIPLIER[market]

    dates = [datetime.today().date() - timedelta(days=days - i) for i in range(days)]
    day_index = np.arange(days)

    trend = cfg["trend"] * day_index / 30.0
    weekly_season = 40 * np.sin(2 * np.pi * day_index / 7.0)
    noise = rng.normal(0, cfg["volatility"] * 0.15, size=days)

    prices = (cfg["base"] * mult) + trend + weekly_season + noise
    prices = np.clip(prices, a_min=cfg["base"] * 0.4, a_max=None).round(2)

    return pd.DataFrame({"date": dates, "price": prices})
