from ..generated import Prisma
from .config import settings


# Global Prisma client instance
prisma = Prisma()


async def connect_db():
    """Connect to the database"""
    await prisma.connect()


async def disconnect_db():
    """Disconnect from the database"""
    await prisma.disconnect()


async def get_db():
    """Dependency to get database client"""
    return prisma 