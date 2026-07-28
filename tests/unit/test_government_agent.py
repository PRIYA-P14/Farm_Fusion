"""Unit tests for GovernmentAgent."""

import pytest
from agents.government_agent import GovernmentAgent


@pytest.mark.asyncio
async def test_government_agent_init():
    agent = GovernmentAgent()
    assert agent.name == "GovernmentAgent"
