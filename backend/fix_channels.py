#!/usr/bin/env python3
"""
Script to fix channel types in the database.
"""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import prisma


async def fix_channels():
    """Fix channel types in the database."""
    try:
        await prisma.connect()
        print("🔌 Connected to database")
        
        # Get all channels
        channels = await prisma.channel.find_many()
        print(f"Found {len(channels)} channels")
        
        for channel in channels:
            print(f"- {channel.name}: isPublic={channel.isPublic}")
        
        # Update channels based on their names
        for channel in channels:
            if "private" in channel.name.lower():
                if channel.isPublic:
                    print(f"🔄 Updating {channel.name} to private...")
                    await prisma.channel.update(
                        where={"id": channel.id},
                        data={"isPublic": False}
                    )
                    print(f"✅ Updated {channel.name} to private")
                else:
                    print(f"✅ {channel.name} is already private")
            else:
                if not channel.isPublic:
                    print(f"🔄 Updating {channel.name} to public...")
                    await prisma.channel.update(
                        where={"id": channel.id},
                        data={"isPublic": True}
                    )
                    print(f"✅ Updated {channel.name} to public")
                else:
                    print(f"✅ {channel.name} is already public")
        
        # Show final state
        print("\n📊 Final Channel State:")
        channels = await prisma.channel.find_many()
        for channel in channels:
            status = "Private" if not channel.isPublic else "Public"
            print(f"- {channel.name}: {status} (isPublic={channel.isPublic})")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await prisma.disconnect()
        print("\n🔌 Disconnected from database")


if __name__ == "__main__":
    asyncio.run(fix_channels()) 