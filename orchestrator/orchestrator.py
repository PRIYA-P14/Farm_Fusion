"""Orchestrator — Coordinates all AgriVerse AI agents."""

from typing import Any
from orchestrator.agent_registry import AgentRegistry


class AgriOrchestrator:
    """
    Central orchestrator that routes queries to the appropriate agent(s)
    and aggregates responses for the user.
    """

    def __init__(self):
        self.registry = AgentRegistry()

    async def run(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        """Route a query to the best-fit agent(s) and return aggregated results."""
        # TODO: Implement intent classification and agent routing
        pass

    async def run_all(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        """Broadcast a query to all agents and aggregate their responses."""
        # TODO: Implement parallel multi-agent execution
        pass
