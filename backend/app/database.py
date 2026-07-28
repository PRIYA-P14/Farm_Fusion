import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_default_database()
    logger.info("✅ MongoDB connected")

async def close_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_db():
    return db
