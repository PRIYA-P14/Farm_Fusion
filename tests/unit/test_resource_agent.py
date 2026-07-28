"""Unit tests for ResourceAgent."""

import pytest
from agents.resource_agent import ResourceAgent


@pytest.mark.asyncio
async def test_resource_agent_init():
    agent = ResourceAgent()
    assert agent.name == "ResourceAgent"
