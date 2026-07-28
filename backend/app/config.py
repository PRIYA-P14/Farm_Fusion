from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 5000
    MONGODB_URI: str = "mongodb://localhost:27017/soil_intelligence"
    GROQ_API_KEY: str = ""
    JWT_SECRET: str = "soil-intelligence-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"

settings = Settings()
