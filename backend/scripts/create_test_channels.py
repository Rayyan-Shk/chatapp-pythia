#!/usr/bin/env python3
"""
Script to create test channels in the database.
"""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import prisma


async def create_test_channels():
    """Create some test channels for development."""
    try:
        await prisma.connect()
        print("Connected to database")
        
        # Check if channels already exist
        existing_channels = await prisma.channel.find_many()
        print(f"Found {len(existing_channels)} existing channels")
        
        # Test channels to create
        test_channels = [
            {
                "name": "general",
                "description": "General discussion for everyone",
                "isPublic": True
            },
            {
                "name": "random",
                "description": "Random conversations and fun stuff",
                "isPublic": True
            },
            {
                "name": "announcements",
                "description": "Important announcements and updates",
                "isPublic": True
            },
            {
                "name": "development",
                "description": "Development and technical discussions",
                "isPublic": True
            },
            {
                "name": "marketing",
                "description": "Marketing team discussions",
                "isPublic": True
            }
        ]
        
        created_count = 0
        
        for channel_data in test_channels:
            # Check if channel already exists
            existing = await prisma.channel.find_first(
                where={"name": channel_data["name"]}
            )
            
            if existing:
                print(f"Channel '{channel_data['name']}' already exists")
                continue
                
            # Create the channel
            channel = await prisma.channel.create(data=channel_data)
            print(f"Created channel: {channel.name} (ID: {channel.id})")
            created_count += 1
        
        print(f"\nSummary:")
        print(f"- Created {created_count} new channels")
        print(f"- Total channels in database: {len(existing_channels) + created_count}")
        
        # List all channels
        all_channels = await prisma.channel.find_many(
            order_by={"name": "asc"}
        )
        
        print(f"\nAll channels:")
        for channel in all_channels:
            status = "Public" if channel.isPublic else "Private"
            print(f"- {channel.name} ({status}): {channel.description}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await prisma.disconnect()
        print("\nDisconnected from database")


if __name__ == "__main__":
    asyncio.run(create_test_channels()) 