"""Unit tests for CropAgent."""

import pytest
from agents.crop_agent import CropAgent


@pytest.mark.asyncio
async def test_crop_agent_init():
    agent = CropAgent()
    assert agent.name == "CropAgent"


@pytest.mark.asyncio
async def test_crop_agent_get_tools():
    agent = CropAgent()
    tools = await agent.get_tools()
    assert isinstance(tools, list)
