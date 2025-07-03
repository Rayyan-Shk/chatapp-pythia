#!/usr/bin/env python3
import asyncio
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import prisma
from app.models.channel import ChannelCreate

async def test_channel_creation():
    """Test channel creation to see what's happening."""
    try:
        await prisma.connect()
        print("Connected to database")
        
        # Test channel name
        test_name = "test-channel-123"
        
        # Check if channel exists
        existing = await prisma.channel.find_first(
            where={"name": test_name}
        )
        
        if existing:
            print(f"Channel '{test_name}' already exists!")
            return
        
        # Try to create channel
        print(f"Creating channel: {test_name}")
        channel = await prisma.channel.create(
            data={
                "name": test_name,
                "description": "Test channel"
            }
        )
        
        print(f"Successfully created channel: {channel.name} (ID: {channel.id})")
        
        # Clean up - delete the test channel
        await prisma.channel.delete(where={"id": channel.id})
        print(f"Cleaned up test channel")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await prisma.disconnect()
        print("🔌 Disconnected from database")

if __name__ == "__main__":
    asyncio.run(test_channel_creation()) 