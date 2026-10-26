from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = MongoDB()

async def connect_to_mongo():
    """Initialize Async Motor MongoDB connection"""
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_instance.db = db_instance.client[settings.MONGO_DB_NAME]
    
    # Create indexes for optimal query speeds and unique constraints
    await db_instance.db["users"].create_index("username", unique=True)
    await db_instance.db["projects"].create_index([("user_id", 1), ("name", 1)])
    await db_instance.db["api_keys"].create_index([("project_id", 1)])
    await db_instance.db["api_keys"].create_index([("user_id", 1)])
    await db_instance.db["monitors"].create_index([("user_id", 1), ("project_id", 1)])
    print(f"Connected to MongoDB (DB: {settings.MONGO_DB_NAME})")

async def close_mongo_connection():
    """Close MongoDB connection gracefully"""
    if db_instance.client:
        db_instance.client.close()
        print("Closed MongoDB connection.")

def get_database() -> AsyncIOMotorDatabase:
    """Dependency helper to inject database into routes"""
    return db_instance.db
