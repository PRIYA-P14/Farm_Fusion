"""Integration tests for the orchestrator."""

import pytest
from orchestrator.orchestrator import AgriOrchestrator


@pytest.mark.asyncio
async def test_orchestrator_init():
    orch = AgriOrchestrator()
    assert orch.registry is not None


@pytest.mark.asyncio
async def test_registry_has_all_agents():
    orch = AgriOrchestrator()
    agents = orch.registry.all()
    assert len(agents) == 6
