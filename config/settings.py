"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "AgriVerse-AI"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = True

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"

    DATABASE_URL: str = ""

    WEATHER_API_KEY: str = ""
    WEATHER_API_URL: str = "https://api.openweathermap.org/data/2.5"

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
