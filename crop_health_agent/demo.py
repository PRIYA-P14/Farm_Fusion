"""
Quick command-line demo for the Crop Health Agent.
Run: python demo.py
"""
import json
from agent import CropHealthAgent

agent = CropHealthAgent()

result = agent.run({
    "crop": "Tomato",
    "symptoms": ["brown spots", "yellow leaves", "wilting"],
    "field_area_acres": 2.5,
    "expected_yield_kg_per_acre": 800,
})

print(json.dumps(result, indent=2))
