#!/usr/bin/env python3
"""
Test script to verify first user setup works correctly.
"""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import prisma


async def test_first_user_setup():
    """Test the first user setup and channel assignment."""
    try:
        await prisma.connect()
        print("Connected to database")
        
        # Check users
        users = await prisma.user.find_many(order_by={"createdAt": "asc"})
        print(f"Found {len(users)} users")
        
        if not users:
            print("❌ No users found. Please register a user first.")
            return
        
        first_user = users[0]
        print(f"First user: {first_user.username} ({first_user.email})")
        
        # Check channels
        channels = await prisma.channel.find_many()
        print(f"Found {len(channels)} channels")
        
        for channel in channels:
            print(f"- {channel.name}: {channel.description}")
        
        # Check user's channel memberships
        user_channels = await prisma.channelmember.find_many(
            where={"userId": first_user.id},
            include={"channel": True}
        )
        
        print(f"\nUser's channel memberships:")
        if user_channels:
            for member in user_channels:
                print(f"- {member.channel.name}")
        else:
            print("- No channel memberships found")
        
        # Check if user has any roles
        user_roles = await prisma.userrole.find_many(
            where={"userId": first_user.id}
        )
        
        print(f"\nUser's roles:")
        if user_roles:
            for role in user_roles:
                scope = f"in #{role.channel.name}" if role.channel else "Global"
                print(f"- {role.role} ({scope})")
        else:
            print("- No roles assigned (default: MEMBER)")
        
        print(f"\n✅ Test complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await prisma.disconnect()
        print("\n🔌 Disconnected from database")


if __name__ == "__main__":
    asyncio.run(test_first_user_setup()) 