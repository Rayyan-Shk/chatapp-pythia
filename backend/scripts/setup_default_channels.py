#!/usr/bin/env python3
"""
Script to set up default channels and assign first user to them.
This should be run after the first user registers.
"""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import prisma


async def setup_default_channels():
    """Create default channels and assign first user to them."""
    try:
        await prisma.connect()
        print("Connected to database")
        
        # Check if channels already exist
        existing_channels = await prisma.channel.find_many()
        print(f"Found {len(existing_channels)} existing channels")
        
        # Default channels to create
        default_channels = [
            {
                "name": "general",
                "description": "General discussion for everyone"
            },
            {
                "name": "random",
                "description": "Random conversations and fun stuff"
            },
            {
                "name": "announcements",
                "description": "Important announcements and updates"
            }
        ]
        
        created_channels = []
        
        for channel_data in default_channels:
            # Check if channel already exists
            existing = await prisma.channel.find_first(
                where={"name": channel_data["name"]}
            )
            
            if existing:
                print(f"Channel '{channel_data['name']}' already exists")
                created_channels.append(existing)
                continue
                
            # Create the channel
            channel = await prisma.channel.create(data=channel_data)
            print(f"Created channel: {channel.name} (ID: {channel.id})")
            created_channels.append(channel)
        
        # Get the first user (assuming they exist)
        first_user = await prisma.user.find_first(
            order_by={"createdAt": "asc"}
        )
        
        if not first_user:
            print("❌ No users found in database. Please register a user first.")
            return
        
        print(f"Found first user: {first_user.username}")
        
        # Assign first user to all channels
        for channel in created_channels:
            # Check if user is already a member
            existing_member = await prisma.channelmember.find_unique(
                where={
                    "userId_channelId": {
                        "userId": first_user.id,
                        "channelId": channel.id
                    }
                }
            )
            
            if existing_member:
                print(f"User {first_user.username} is already a member of {channel.name}")
                continue
            
            # Add user to channel
            await prisma.channelmember.create(
                data={
                    "userId": first_user.id,
                    "channelId": channel.id
                }
            )
            print(f"Added {first_user.username} to {channel.name}")
        
        print(f"\n✅ Setup complete!")
        print(f"- Created {len(created_channels)} channels")
        print(f"- Assigned {first_user.username} to all channels")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await prisma.disconnect()
        print("\n🔌 Disconnected from database")


if __name__ == "__main__":
    asyncio.run(setup_default_channels()) 