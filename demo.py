"""
Quick command-line demo of the Market Price Prediction Agent.
Run:  python demo.py
"""

import json
from agent import MarketPriceAgent

if __name__ == "__main__":
    agent = MarketPriceAgent()

    query = {
        "crop": "Onion",
        "market": "Erode Market",
        "quantity_kg": 500,
        "cost_price_per_kg": 12,
        "farmer_lat": 11.3814,   # Tiruchengode
        "farmer_lon": 77.8949,
    }

    result = agent.run(query)
    print(json.dumps(result, indent=2))
