"""Market prompt templates."""

MARKET_SYSTEM_PROMPT = "You are an expert agricultural market analyst."

MARKET_TREND_TEMPLATE = """
Based on the following market data for {crop_name} in {state}:
{market_data}

Provide price trend analysis and selling recommendations for the next {days} days.
"""
