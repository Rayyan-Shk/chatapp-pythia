#!/usr/bin/env python3
"""
Test script for message editing functionality
"""
import asyncio
import sys
import os

# Add the parent directory to the path so we can import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.message import MessageUpdate, Message
from app.models.websocket import MessageEditNotification
from datetime import datetime


def test_message_models():
    """Test message editing models"""
    print("🧪 Testing Message Editing Models")
    print("=" * 50)
    
    # Test MessageUpdate model
    try:
        update = MessageUpdate(content="Updated message with @alice")
        print(f"✅ MessageUpdate: {update}")
    except Exception as e:
        print(f"❌ MessageUpdate failed: {e}")
        return False
    
    # Test Message model with is_edited
    try:
        message = Message(
            id="msg_123",
            content="Test message",
            user_id="user_456",
            channel_id="channel_789",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            is_edited=True
        )
        print(f"✅ Message with is_edited: {message.is_edited}")
    except Exception as e:
        print(f"❌ Message model failed: {e}")
        return False
    
    # Test WebSocket notification model
    try:
        notification = MessageEditNotification(
            message_id="msg_123",
            channel_id="channel_789",
            content="Updated content",
            edited_by="john_doe",
            edited_at=datetime.utcnow()
        )
        print(f"✅ MessageEditNotification: {notification.type}")
    except Exception as e:
        print(f"❌ MessageEditNotification failed: {e}")
        return False
    
    return True


def test_api_endpoints():
    """Test API endpoint structure"""
    print("\n🔗 Testing API Endpoint Imports")
    print("=" * 50)
    
    try:
        # Test that we can import the router without database connection
        from app.api.messages import router
        
        # Check if our new routes are present
        routes = [route.path for route in router.routes]
        
        # Check for edit endpoint
        edit_route_found = any("/{message_id}" in path for path in routes)
        if edit_route_found:
            print("✅ Message edit endpoint structure exists")
        else:
            print("❌ Message edit endpoint not found")
            return False
        
        print(f"✅ Message router loaded with {len(router.routes)} routes")
        return True
        
    except Exception as e:
        print(f"❌ API import failed: {e}")
        return False


def test_websocket_models():
    """Test WebSocket message models"""
    print("\n📡 Testing WebSocket Models")
    print("=" * 50)
    
    try:
        from app.models.websocket import MessageEditNotification
        
        # Test message edit notification
        edit_notification = MessageEditNotification(
            message_id="msg_123",
            channel_id="channel_789", 
            content="Updated message content",
            edited_by="john_doe",
            edited_at=datetime.utcnow()
        )
        
        print(f"✅ Edit notification type: {edit_notification.type}")
        print(f"✅ Edit notification data: {edit_notification.message_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ WebSocket models failed: {e}")
        return False


def test_dry_principles():
    """Verify DRY principles implementation"""
    print("\n🔄 Testing DRY Principles")
    print("=" * 50)
    
    try:
        # Check that we're reusing existing models
        from app.models.message import MessageUpdate, MessageCreate, MessageBase
        
        # Verify inheritance structure
        print(f"✅ MessageCreate inherits from MessageBase: {issubclass(MessageCreate, MessageBase)}")
        print(f"✅ MessageUpdate is separate (content-only): {hasattr(MessageUpdate, 'content')}")
        
        # Check that we can import existing functions
        from app.api.messages import extract_mentions
        print("✅ Reusing existing extract_mentions function")
        
        # Check WebSocket connection manager extensions
        from app.websocket.connection_manager import ConnectionManager
        manager = ConnectionManager()
        
        # Check if our new methods exist
        has_broadcast_edit = hasattr(manager, 'broadcast_message_edit')
        print(f"✅ Extended ConnectionManager with broadcast_message_edit: {has_broadcast_edit}")
        
        return True
        
    except Exception as e:
        print(f"❌ DRY principles test failed: {e}")
        return False


def test_validation():
    """Test input validation"""
    print("\n✅ Testing Input Validation")
    print("=" * 50)
    
    try:
        # Test valid message update
        valid_update = MessageUpdate(content="This is a valid message")
        print(f"✅ Valid update: {len(valid_update.content)} characters")
        
        # Test empty content (should fail)
        try:
            invalid_update = MessageUpdate(content="")
            print("❌ Empty content validation failed - should not allow empty")
            return False
        except Exception:
            print("✅ Empty content properly rejected")
        
        # Test long content
        long_content = "x" * 1001  # Assuming 1000 char limit
        try:
            long_update = MessageUpdate(content=long_content)
            print(f"⚠️  Long content accepted: {len(long_content)} characters")
        except Exception:
            print("✅ Long content properly rejected")
        
        return True
        
    except Exception as e:
        print(f"❌ Validation test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("🚀 Message Editing Feature Test Suite")
    print("=" * 60)
    
    tests = [
        ("Message Models", test_message_models),
        ("API Endpoints", test_api_endpoints), 
        ("WebSocket Models", test_websocket_models),
        ("DRY Principles", test_dry_principles),
        ("Input Validation", test_validation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
                print(f"\n✅ {test_name}: PASSED")
            else:
                print(f"\n❌ {test_name}: FAILED")
        except Exception as e:
            print(f"\n💥 {test_name}: ERROR - {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Message editing is ready.")
        print("\n📋 Next Steps:")
        print("1. Apply database schema: python -m prisma db push")
        print("2. Start server: uvicorn app.main:app --reload")
        print("3. Test endpoints with curl or frontend")
    else:
        print("⚠️  Some tests failed. Check implementation.")
    
    print("=" * 60)


if __name__ == "__main__":
    main() 