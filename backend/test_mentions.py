#!/usr/bin/env python3
"""
Test script to verify mention persistence
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import prisma
from app.models.message import MessageFormatter

async def test_mention_persistence():
    """Test that mentions are properly persisted and retrieved"""
    
    print("🔍 Testing mention persistence...")
    
    try:
        # Connect to database
        await prisma.connect()
        
        # Get a few messages with mentions
        messages = await prisma.message.find_many(
            where={},
            include={
                "user": True,
                "mentions": {
                    "include": {"user": True}
                }
            },
            take=5
        )
        
        print(f"📨 Found {len(messages)} messages to check")
        
        for i, msg in enumerate(messages, 1):
            print(f"\n--- Message {i} ---")
            print(f"Content: {msg.content}")
            print(f"Author: {msg.user.username}")
            print(f"Mentions in DB: {len(msg.mentions)}")
            
            # Check if content has @mentions
            mentions_in_content = MessageFormatter.extract_mentions(msg.content)
            print(f"Mentions in content: {mentions_in_content}")
            
            # Check if mentions are properly stored
            if msg.mentions:
                print("Stored mentions:")
                for mention in msg.mentions:
                    print(f"  - @{mention.user.username}")
            
            # Verify consistency
            if mentions_in_content and not msg.mentions:
                print("❌ WARNING: Content has mentions but none stored in DB!")
            elif not mentions_in_content and msg.mentions:
                print("❌ WARNING: DB has mentions but content doesn't contain them!")
            elif mentions_in_content and msg.mentions:
                print("✅ Mentions properly stored and retrieved")
            else:
                print("ℹ️  No mentions in this message")
        
        # Test specific mention extraction
        print("\n🔧 Testing mention extraction...")
        test_content = "Hello @john and @jane, check this out!"
        extracted = MessageFormatter.extract_mentions(test_content)
        print(f"Test content: {test_content}")
        print(f"Extracted mentions: {extracted}")
        
        # Test formatting parsing
        print("\n🎨 Testing formatting parsing...")
        formatting = MessageFormatter.parse_formatting(test_content)
        print(f"Has mentions: {formatting.has_mentions}")
        print(f"Mention count: {formatting.mention_count}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(test_mention_persistence()) 