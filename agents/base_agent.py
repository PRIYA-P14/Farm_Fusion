"""Base agent — Abstract class for all AgriVerse agents."""

from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """Abstract base class that all agents must implement."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    async def run(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        """Execute the agent with a given query and optional context."""
        pass

    @abstractmethod
    async def get_tools(self) -> list:
        """Return the list of tools available to this agent."""
        pass

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name}>"
