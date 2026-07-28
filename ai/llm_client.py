"""LLM Client — Wrapper for OpenAI / LangChain integration."""

from config.settings import settings


class LLMClient:
    """Centralized LLM client for all agents."""

    def __init__(self):
        self.model = settings.OPENAI_MODEL
        self.api_key = settings.OPENAI_API_KEY

    async def complete(self, prompt: str, system_prompt: str | None = None) -> str:
        # TODO: Implement OpenAI API call
        pass

    async def embed(self, text: str) -> list[float]:
        # TODO: Implement text embedding
        pass
