import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None
    connected: bool = False

db_manager = DatabaseManager()

async def connect_to_mongo():
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGO_URI[:25]}...")
        db_manager.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        # Verify connection
        await db_manager.client.admin.command('ping')
        
        # Get database name from URI or fallback to safex
        db_name = "safex"
        if "/" in settings.MONGO_URI.split("://")[-1]:
            uri_parts = settings.MONGO_URI.split("?")[0].split("/")
            if uri_parts[-1]:
                db_name = uri_parts[-1]
                
        db_manager.db = db_manager.client[db_name]
        db_manager.connected = True
        logger.info(f"✅ Connected to MongoDB database: {db_name}")
        
        # Create indexes
        extensions_collection = db_manager.db["extensions"]
        await extensions_collection.create_index([("extensionId", 1), ("scannedAt", -1)])
        await extensions_collection.create_index([("scannedAt", -1)])
        await extensions_collection.create_index([("score", 1)])
        
    except Exception as e:
        logger.warning(f"⚠️ MongoDB connection unavailable ({e}). Running in memory/fallback mode.")
        db_manager.connected = False

async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_manager.db
