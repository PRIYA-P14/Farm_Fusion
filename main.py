"""
AgriVerse-AI — Entry Point
Multi-Agent Agriculture Intelligence System
"""

import uvicorn
from config.settings import settings


def main():
    uvicorn.run(
        "api.app:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )


if __name__ == "__main__":
    main()
