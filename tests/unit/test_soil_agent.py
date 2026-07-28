"""Unit tests for SoilAgent."""

import pytest
from agents.soil_agent import SoilAgent


@pytest.mark.asyncio
async def test_soil_agent_init():
    agent = SoilAgent()
    assert agent.name == "SoilAgent"
