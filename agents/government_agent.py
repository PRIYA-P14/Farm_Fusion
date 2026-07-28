"""Government Agent — Government schemes, subsidies, and policy information."""

from typing import Any
from agents.base_agent import BaseAgent


class GovernmentAgent(BaseAgent):
    """Agent responsible for government schemes, subsidies, and agricultural policy."""

    def __init__(self):
        super().__init__(
            name="GovernmentAgent",
            description="Provides information on government schemes, subsidies, loans, and agricultural policies.",
        )

    async def run(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        # TODO: Implement LLM + government data integration
        pass

    async def get_tools(self) -> list:
        # TODO: Return government-specific tools
        return []
