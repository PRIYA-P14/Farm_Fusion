"""Unit tests for WeatherAgent."""

import pytest
from agents.weather_agent import WeatherAgent


@pytest.mark.asyncio
async def test_weather_agent_init():
    agent = WeatherAgent()
    assert agent.name == "WeatherAgent"


@pytest.mark.asyncio
async def test_weather_agent_get_tools():
    agent = WeatherAgent()
    tools = await agent.get_tools()
    assert isinstance(tools, list)
