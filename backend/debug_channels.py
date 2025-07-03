#!/usr/bin/env python3
"""
Debug script to check channel data and API responses.
"""

import asyncio
import sys
import os
import json

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import prisma
from app.models.channel import Channel, ChannelWithMembers
from app.models.user import User


async def debug_channels():
    """Debug channel data and API responses."""
    try:
        await prisma.connect()
        print("🔌 Connected to database")
        
        # Get all channels from database
        print("\n📊 Database Channels:")
        channels = await prisma.channel.find_many()
        for channel in channels:
            print(f"- {channel.name}: isPublic={channel.isPublic}")
        
        # Test the Channel model validation
        print("\n🔧 Testing Channel Model Validation:")
        for channel in channels:
            try:
                channel_model = Channel.model_validate(channel)
                print(f"- {channel_model.name}: is_public={channel_model.is_public}")
            except Exception as e:
                print(f"- Error validating {channel.name}: {e}")
        
        # Test the API response format
        print("\n🌐 Testing API Response Format:")
        for channel in channels:
            try:
                # Simulate what the API does
                channel_obj = Channel.model_validate(channel)
                response_data = channel_obj.model_dump()
                print(f"- {channel_obj.name}: {json.dumps(response_data, indent=2)}")
            except Exception as e:
                print(f"- Error creating response for {channel.name}: {e}")
        
        # Check if there are any users to test with
        users = await prisma.user.find_many(limit=1)
        if users:
            print(f"\n👤 Found user: {users[0].username}")
            
            # Test channel members
            channel_members = await prisma.channelmember.find_many(
                where={"userId": users[0].id},
                include={
                    "channel": {
                        "include": {
                            "members": {
                                "include": {"user": True}
                            }
                        }
                    }
                }
            )
            
            print(f"\n📺 User's Channels:")
            for member in channel_members:
                channel_data = member.channel
                try:
                    # Convert members to User objects
                    members = [User.model_validate(m.user) for m in channel_data.members]
                    
                    # Create ChannelWithMembers using proper model validation
                    channel_with_members = ChannelWithMembers(
                        **Channel.model_validate(channel_data).model_dump(),
                        members=members,
                        member_count=len(members)
                    )
                    
                    print(f"- {channel_with_members.name}: is_public={channel_with_members.is_public}, members={len(members)}")
                except Exception as e:
                    print(f"- Error processing {channel_data.name}: {e}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await prisma.disconnect()
        print("\n🔌 Disconnected from database")


if __name__ == "__main__":
    asyncio.run(debug_channels()) 