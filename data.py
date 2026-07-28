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

CROPS = [
    "Wheat", "Rice", "Tomato", "Onion", "Potato", "Cotton", "Maize", "Soybean",
    "Sugarcane", "Turmeric", "Chilli", "Groundnut", "Banana", "Garlic",
    "Brinjal", "Cabbage", "Cauliflower", "Sunflower", "Jowar", "Bajra",
    "Mango", "Coconut", "Tamarind", "Drumstick", "Bitter Gourd", "Bottle Gourd",
    "Pumpkin", "Okra", "Spinach", "Coriander", "Curry Leaves", "Beetroot",
    "Carrot", "Radish", "Peas", "Beans", "Lemon", "Papaya",
    "Guava", "Watermelon", "Cucumber", "Ginger", "Mustard", "Sesame", "Lentil",
]

# base price (INR/quintal), volatility, and monthly trend per crop
# used only to seed realistic-looking mock data
CROP_BASE_PRICE = {
    "Wheat":       {"base": 2200, "volatility": 40,  "trend": 3.0},
    "Rice":        {"base": 2600, "volatility": 50,  "trend": 2.0},
    "Tomato":      {"base": 1500, "volatility": 300, "trend": -5.0},
    "Onion":       {"base": 1800, "volatility": 250, "trend": 8.0},
    "Potato":      {"base": 1200, "volatility": 150, "trend": 1.0},
    "Cotton":      {"base": 6500, "volatility": 120, "trend": 5.0},
    "Maize":       {"base": 1900, "volatility": 60,  "trend": 1.5},
    "Soybean":     {"base": 4200, "volatility": 100, "trend": 4.0},
    "Sugarcane":   {"base": 350,  "volatility": 15,  "trend": 0.5},
    "Turmeric":    {"base": 7500, "volatility": 400, "trend": 10.0},
    "Chilli":      {"base": 9000, "volatility": 500, "trend": 12.0},
    "Groundnut":   {"base": 5500, "volatility": 180, "trend": 6.0},
    "Banana":      {"base": 1400, "volatility": 120, "trend": 2.0},
    "Garlic":      {"base": 8000, "volatility": 600, "trend": 15.0},
    "Brinjal":     {"base": 900,  "volatility": 200, "trend": -3.0},
    "Cabbage":     {"base": 700,  "volatility": 180, "trend": -2.0},
    "Cauliflower": {"base": 1100, "volatility": 220, "trend": -2.5},
    "Sunflower":   {"base": 5800, "volatility": 130, "trend": 5.0},
    "Jowar":       {"base": 2100, "volatility": 55,  "trend": 2.0},
    "Bajra":        {"base": 2000,  "volatility": 50,   "trend": 1.8},
    "Mango":        {"base": 3500,  "volatility": 400,  "trend": 8.0},
    "Coconut":      {"base": 2800,  "volatility": 150,  "trend": 3.0},
    "Tamarind":     {"base": 6000,  "volatility": 300,  "trend": 5.0},
    "Drumstick":    {"base": 2200,  "volatility": 250,  "trend": 4.0},
    "Bitter Gourd": {"base": 1600,  "volatility": 200,  "trend": -2.0},
    "Bottle Gourd": {"base": 800,   "volatility": 150,  "trend": -1.5},
    "Pumpkin":      {"base": 700,   "volatility": 120,  "trend": -1.0},
    "Okra":         {"base": 1800,  "volatility": 220,  "trend": 2.0},
    "Spinach":      {"base": 1200,  "volatility": 180,  "trend": -1.0},
    "Coriander":    {"base": 3000,  "volatility": 350,  "trend": 6.0},
    "Curry Leaves": {"base": 4000,  "volatility": 400,  "trend": 5.0},
    "Beetroot":     {"base": 1000,  "volatility": 160,  "trend": 1.0},
    "Carrot":       {"base": 1500,  "volatility": 200,  "trend": 1.5},
    "Radish":       {"base": 600,   "volatility": 100,  "trend": -0.5},
    "Peas":         {"base": 3500,  "volatility": 300,  "trend": 4.0},
    "Beans":        {"base": 2500,  "volatility": 280,  "trend": 3.0},
    "Lemon":        {"base": 4500,  "volatility": 500,  "trend": 7.0},
    "Papaya":       {"base": 1800,  "volatility": 200,  "trend": 2.0},
    "Guava":        {"base": 2200,  "volatility": 250,  "trend": 3.0},
    "Watermelon":   {"base": 900,   "volatility": 150,  "trend": -2.0},
    "Cucumber":     {"base": 1000,  "volatility": 160,  "trend": -1.5},
    "Ginger":       {"base": 8500,  "volatility": 600,  "trend": 12.0},
    "Mustard":      {"base": 5200,  "volatility": 150,  "trend": 5.0},
    "Sesame":       {"base": 13000, "volatility": 400,  "trend": 8.0},
    "Lentil":       {"base": 6500,  "volatility": 200,  "trend": 6.0},
}

# mock markets: name -> (lat, lon, state)
MARKETS = {
    # Tamil Nadu
    "Erode Market":           (11.3410, 77.7172, "Tamil Nadu"),
    "Salem Market":           (11.6643, 78.1460, "Tamil Nadu"),
    "Coimbatore Market":      (11.0168, 76.9558, "Tamil Nadu"),
    "Namakkal Market":        (11.2189, 78.1677, "Tamil Nadu"),
    "Tiruchengode Market":    (11.3814, 77.8949, "Tamil Nadu"),
    "Karur Market":           (10.9601, 78.0766, "Tamil Nadu"),
    "Madurai Market":         (9.9252,  78.1198, "Tamil Nadu"),
    "Chennai Market":         (13.0827, 80.2707, "Tamil Nadu"),
    "Trichy Market":          (10.7905, 78.7047, "Tamil Nadu"),
    "Tirunelveli Market":     (8.7139,  77.7567, "Tamil Nadu"),
    "Vellore Market":         (12.9165, 79.1325, "Tamil Nadu"),
    "Thanjavur Market":       (10.7870, 79.1378, "Tamil Nadu"),
    "Dindigul Market":        (10.3624, 77.9695, "Tamil Nadu"),
    "Tiruppur Market":        (11.1085, 77.3411, "Tamil Nadu"),
    "Kancheepuram Market":    (12.8342, 79.7036, "Tamil Nadu"),
    "Cuddalore Market":       (11.7480, 79.7714, "Tamil Nadu"),
    "Villupuram Market":      (11.9401, 79.4861, "Tamil Nadu"),
    "Pudukottai Market":      (10.3797, 78.8214, "Tamil Nadu"),
    "Ramanathapuram Market":  (9.3639,  78.8395, "Tamil Nadu"),
    "Virudhunagar Market":    (9.5680,  77.9624, "Tamil Nadu"),
    "Sivaganga Market":       (9.8477,  78.4800, "Tamil Nadu"),
    "Thoothukudi Market":     (8.7642,  78.1348, "Tamil Nadu"),
    "Nagercoil Market":       (8.1833,  77.4119, "Tamil Nadu"),
    "Krishnagiri Market":     (12.5186, 78.2137, "Tamil Nadu"),
    "Dharmapuri Market":      (12.1211, 78.1582, "Tamil Nadu"),
    "Perambalur Market":      (11.2342, 78.8806, "Tamil Nadu"),
    "Ariyalur Market":        (11.1412, 79.0762, "Tamil Nadu"),
    "Nagapattinam Market":    (10.7672, 79.8449, "Tamil Nadu"),
    "Mayiladuthurai Market":  (11.1015, 79.6516, "Tamil Nadu"),
    "Tiruvarur Market":       (10.7731, 79.6367, "Tamil Nadu"),
    "Kallakurichi Market":    (11.7380, 78.9607, "Tamil Nadu"),
    "Ranipet Market":         (12.9224, 79.3327, "Tamil Nadu"),
    "Tenkasi Market":         (8.9597,  77.3152, "Tamil Nadu"),
    "Chengalpattu Market":    (12.6921, 79.9764, "Tamil Nadu"),
    "Tirupattur Market":      (12.4965, 78.5726, "Tamil Nadu"),
    "Nilgiris Market":        (11.4916, 76.7337, "Tamil Nadu"),
    # Karnataka
    "Bangalore Market":    (12.9716, 77.5946, "Karnataka"),
    "Mysore Market":       (12.2958, 76.6394, "Karnataka"),
    "Hubli Market":        (15.3647, 75.1240, "Karnataka"),
    "Belgaum Market":      (15.8497, 74.4977, "Karnataka"),
    "Davangere Market":    (14.4644, 75.9218, "Karnataka"),
    "Shimoga Market":      (13.9299, 75.5681, "Karnataka"),
    # Andhra Pradesh
    "Guntur Market":       (16.3067, 80.4365, "Andhra Pradesh"),
    "Kurnool Market":      (15.8281, 78.0373, "Andhra Pradesh"),
    "Vijayawada Market":   (16.5062, 80.6480, "Andhra Pradesh"),
    "Visakhapatnam Market":(17.6868, 83.2185, "Andhra Pradesh"),
    "Nellore Market":      (14.4426, 79.9865, "Andhra Pradesh"),
    # Telangana
    "Hyderabad Market":    (17.3850, 78.4867, "Telangana"),
    "Warangal Market":     (17.9784, 79.5941, "Telangana"),
    "Nizamabad Market":    (18.6725, 78.0941, "Telangana"),
    # Maharashtra
    "Pune Market":         (18.5204, 73.8567, "Maharashtra"),
    "Nashik Market":       (19.9975, 73.7898, "Maharashtra"),
    "Nagpur Market":       (21.1458, 79.0882, "Maharashtra"),
    "Aurangabad Market":   (19.8762, 75.3433, "Maharashtra"),
    "Solapur Market":      (17.6599, 75.9064, "Maharashtra"),
    # Gujarat
    "Ahmedabad Market":    (23.0225, 72.5714, "Gujarat"),
    "Surat Market":        (21.1702, 72.8311, "Gujarat"),
    "Rajkot Market":       (22.3039, 70.8022, "Gujarat"),
    "Vadodara Market":     (22.3072, 73.1812, "Gujarat"),
    # Rajasthan
    "Jaipur Market":       (26.9124, 75.7873, "Rajasthan"),
    "Jodhpur Market":      (26.2389, 73.0243, "Rajasthan"),
    "Kota Market":         (25.2138, 75.8648, "Rajasthan"),
    # Uttar Pradesh
    "Lucknow Market":      (26.8467, 80.9462, "Uttar Pradesh"),
    "Agra Market":         (27.1767, 78.0081, "Uttar Pradesh"),
    "Kanpur Market":       (26.4499, 80.3319, "Uttar Pradesh"),
    "Varanasi Market":     (25.3176, 82.9739, "Uttar Pradesh"),
    # Punjab & Haryana
    "Amritsar Market":     (31.6340, 74.8723, "Punjab"),
    "Ludhiana Market":     (30.9010, 75.8573, "Punjab"),
    "Chandigarh Market":   (30.7333, 76.7794, "Haryana"),
    "Hisar Market":        (29.1492, 75.7217, "Haryana"),
    # Madhya Pradesh
    "Indore Market":       (22.7196, 75.8577, "Madhya Pradesh"),
    "Bhopal Market":       (23.2599, 77.4126, "Madhya Pradesh"),
    "Jabalpur Market":     (23.1815, 79.9864, "Madhya Pradesh"),
}

# each market sells slightly above/below the crop's base price
MARKET_PRICE_MULTIPLIER = {
    "Erode Market": 1.00, "Salem Market": 0.98, "Coimbatore Market": 1.03,
    "Namakkal Market": 0.95, "Tiruchengode Market": 0.97, "Karur Market": 0.99,
    "Madurai Market": 1.02, "Chennai Market": 1.06, "Trichy Market": 1.01,
    "Tirunelveli Market": 0.96, "Vellore Market": 0.98, "Thanjavur Market": 1.00,
    "Dindigul Market": 0.97, "Tiruppur Market": 1.01,
    "Kancheepuram Market": 1.02, "Cuddalore Market": 0.98, "Villupuram Market": 0.97,
    "Pudukottai Market": 0.96, "Ramanathapuram Market": 0.95, "Virudhunagar Market": 0.98,
    "Sivaganga Market": 0.97, "Thoothukudi Market": 1.00, "Nagercoil Market": 0.99,
    "Krishnagiri Market": 1.01, "Dharmapuri Market": 0.99, "Perambalur Market": 0.96,
    "Ariyalur Market": 0.95, "Nagapattinam Market": 0.97, "Mayiladuthurai Market": 0.98,
    "Tiruvarur Market": 0.96, "Kallakurichi Market": 0.97, "Ranipet Market": 1.00,
    "Tenkasi Market": 0.96, "Chengalpattu Market": 1.03, "Tirupattur Market": 0.99,
    "Nilgiris Market": 1.01,
    "Bangalore Market": 1.08, "Mysore Market": 1.05, "Hubli Market": 1.02,
    "Belgaum Market": 1.00, "Davangere Market": 0.99, "Shimoga Market": 1.01,
    "Guntur Market": 1.04, "Kurnool Market": 0.98, "Vijayawada Market": 1.05,
    "Visakhapatnam Market": 1.07, "Nellore Market": 1.02,
    "Hyderabad Market": 1.09, "Warangal Market": 1.01, "Nizamabad Market": 0.99,
    "Pune Market": 1.06, "Nashik Market": 1.03, "Nagpur Market": 1.04,
    "Aurangabad Market": 1.01, "Solapur Market": 0.99,
    "Ahmedabad Market": 1.05, "Surat Market": 1.04, "Rajkot Market": 1.02,
    "Vadodara Market": 1.03,
    "Jaipur Market": 1.04, "Jodhpur Market": 1.01, "Kota Market": 0.99,
    "Lucknow Market": 1.03, "Agra Market": 1.01, "Kanpur Market": 1.02,
    "Varanasi Market": 1.00,
    "Amritsar Market": 1.05, "Ludhiana Market": 1.06, "Chandigarh Market": 1.04,
    "Hisar Market": 1.02,
    "Indore Market": 1.03, "Bhopal Market": 1.02, "Jabalpur Market": 1.00,
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
