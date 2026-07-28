"""Agent Registry — Manages registration and lookup of all agents."""

from agents.base_agent import BaseAgent


class AgentRegistry:
    """Registry for all available AgriVerse agents."""

    def __init__(self):
        self._agents: dict[str, BaseAgent] = {}
        self._register_defaults()

    def _register_defaults(self):
        from agents import (
            WeatherAgent, CropAgent, SoilAgent,
            MarketAgent, GovernmentAgent, ResourceAgent,
        )
        for agent_cls in [WeatherAgent, CropAgent, SoilAgent, MarketAgent, GovernmentAgent, ResourceAgent]:
            agent = agent_cls()
            self._agents[agent.name] = agent

    def get(self, name: str) -> BaseAgent | None:
        return self._agents.get(name)

    def all(self) -> list[BaseAgent]:
        return list(self._agents.values())

    def register(self, agent: BaseAgent):
        self._agents[agent.name] = agent
