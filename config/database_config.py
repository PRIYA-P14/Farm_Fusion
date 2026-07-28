"""Database configuration."""

from config.settings import settings

DATABASE_CONFIG = {
    "url": settings.DATABASE_URL,
    "pool_size": 10,
    "max_overflow": 20,
    "echo": settings.DEBUG,
}
