import redis.asyncio as redis
from .config import settings


# Global Redis client instance
redis_client = None


async def get_redis_client():
    """Get Redis client"""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


async def close_redis_client():
    """Close Redis client"""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None 