#!/usr/bin/env python3
import asyncio
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import prisma

async def check_channels():
    """Check existing channels in database."""
    try:
        await prisma.connect()
        print("Connected to database")
        
        channels = await prisma.channel.find_many()
        print(f"Found {len(channels)} channels:")
        
        for channel in channels:
            print(f"- {channel.name} (ID: {channel.id})")
            print(f"  Description: {channel.description}")
            print(f"  Created: {channel.createdAt}")
            print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await prisma.disconnect()
        print("🔌 Disconnected from database")

if __name__ == "__main__":
    asyncio.run(check_channels()) 