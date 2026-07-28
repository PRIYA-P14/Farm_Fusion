"""Unit tests for MarketAgent."""

import pytest
from agents.market_agent import MarketAgent


@pytest.mark.asyncio
async def test_market_agent_init():
    agent = MarketAgent()
    assert agent.name == "MarketAgent"
