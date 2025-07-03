from typing import Dict, Set, List, Optional
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging
from datetime import datetime
import asyncio

from ..core.redis import get_redis_client
from ..models.user import User

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time chat with Redis pub/sub"""
    
    def __init__(self):
        # Active WebSocket connections: user_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        
        # Channel rooms: channel_id -> Set of user_ids
        self.channel_rooms: Dict[str, Set[str]] = {}
        
        # User presence: user_id -> last_seen timestamp
        self.user_presence: Dict[str, datetime] = {}
        
        # Typing indicators: channel_id -> Set of user_ids currently typing
        self.typing_users: Dict[str, Set[str]] = {}
        
        # Redis pub/sub task
        self.redis_listener_task = None

    async def start_redis_listener(self):
        """Start Redis pub/sub listener for cross-instance communication"""
        self.redis_listener_task = asyncio.create_task(self._redis_listener())
        logger.info("Redis pub/sub listener started")

    async def stop_redis_listener(self):
        """Stop Redis pub/sub listener"""
        if self.redis_listener_task:
            self.redis_listener_task.cancel()
            try:
                await self.redis_listener_task
            except asyncio.CancelledError:
                pass
        logger.info("Redis pub/sub listener stopped")

    async def _redis_listener(self):
        """Listen for Redis pub/sub messages from other instances"""
        redis_client = await get_redis_client()
        pubsub = redis_client.pubsub()
        
        try:
            # Subscribe to all channel topics
            await pubsub.subscribe("websocket:channel:*")
            await pubsub.subscribe("websocket:user:*")
            await pubsub.subscribe("websocket:global")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    await self._handle_redis_message(message)
                    
        except Exception as e:
            logger.error(f"Redis listener error: {e}")
        finally:
            await pubsub.close()

    async def _handle_redis_message(self, message):
        """Handle incoming Redis pub/sub message"""
        try:
            channel = message["channel"].decode()
            data = json.loads(message["data"].decode())
            
            if channel.startswith("websocket:channel:"):
                channel_id = channel.split(":")[2]
                await self._handle_channel_message(channel_id, data)
            elif channel.startswith("websocket:user:"):
                user_id = channel.split(":")[2]
                await self._handle_user_message(user_id, data)
            elif channel == "websocket:global":
                await self._handle_global_message(data)
                
        except Exception as e:
            logger.error(f"Error handling Redis message: {e}")

    async def _handle_channel_message(self, channel_id: str, data: dict):
        """Handle channel-specific Redis message"""
        message_type = data.get("type")
        
        if message_type == "new_message":
            await self.broadcast_to_channel(channel_id, data, exclude_user=data.get("exclude_user"))
        elif message_type == "typing_indicator":
            await self.broadcast_to_channel(channel_id, data, exclude_user=data.get("exclude_user"))
        elif message_type == "user_joined":
            await self.broadcast_to_channel(channel_id, data, exclude_user=data.get("exclude_user"))
        elif message_type == "user_left":
            await self.broadcast_to_channel(channel_id, data, exclude_user=data.get("exclude_user"))

    async def _handle_user_message(self, user_id: str, data: dict):
        """Handle user-specific Redis message"""
        message_type = data.get("type")
        
        if message_type == "mention_notification":
            await self.send_to_user(user_id, data)
        elif message_type == "force_disconnect":
            await self.disconnect_user(user_id)

    async def _handle_global_message(self, data: dict):
        """Handle global Redis message"""
        message_type = data.get("type")
        
        if message_type == "channel_created":
            # Broadcast to all local connections
            message_str = json.dumps(data)
            disconnected_users = []
            
            for user_id, websocket in self.active_connections.items():
                try:
                    await websocket.send_text(message_str)
                except Exception as e:
                    logger.error(f"Error sending global message to user {user_id}: {e}")
                    disconnected_users.append(user_id)
            
            # Clean up disconnected users
            for user_id in disconnected_users:
                await self.disconnect(user_id)

    async def _publish_to_redis(self, channel: str, data: dict):
        """Publish message to Redis for other instances"""
        try:
            redis_client = await get_redis_client()
            await redis_client.publish(channel, json.dumps(data))
        except Exception as e:
            logger.error(f"Error publishing to Redis: {e}")

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user's WebSocket"""
        await websocket.accept()
        
        # Store the connection
        self.active_connections[user_id] = websocket
        self.user_presence[user_id] = datetime.utcnow()
        
        logger.info(f"User {user_id} connected via WebSocket")
        
        # Broadcast user online status
        await self._broadcast_user_status(user_id, "online")

    async def disconnect(self, user_id: str):
        """Disconnect a user's WebSocket"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
        # Remove from all channel rooms
        for channel_id, users in self.channel_rooms.items():
            users.discard(user_id)
            
        # Remove from typing indicators
        for channel_id, typing_users in self.typing_users.items():
            typing_users.discard(user_id)
            
        # Update presence
        self.user_presence[user_id] = datetime.utcnow()
        
        logger.info(f"User {user_id} disconnected from WebSocket")
        
        # Broadcast user offline status
        await self._broadcast_user_status(user_id, "offline")

    async def join_channel(self, user_id: str, channel_id: str, username: str = None):
        """Add user to a channel room"""
        if channel_id not in self.channel_rooms:
            self.channel_rooms[channel_id] = set()
            
        self.channel_rooms[channel_id].add(user_id)
        
        # Get username if not provided
        if not username:
            try:
                from ..core.database import prisma
                user = await prisma.user.find_unique(where={"id": user_id})
                username = user.username if user else "Unknown User"
            except Exception:
                username = "Unknown User"
        
        # Notify channel members that user joined
        await self.broadcast_to_channel(channel_id, {
            "type": "user_joined",
            "user_id": user_id,
            "username": username,
            "channel_id": channel_id,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_user=user_id)

    async def leave_channel(self, user_id: str, channel_id: str, username: str = None):
        """Remove user from a channel room"""
        if channel_id in self.channel_rooms:
            self.channel_rooms[channel_id].discard(user_id)
            
        # Remove from typing indicators for this channel
        if channel_id in self.typing_users:
            self.typing_users[channel_id].discard(user_id)
            
        # Get username if not provided
        if not username:
            try:
                from ..core.database import prisma
                user = await prisma.user.find_unique(where={"id": user_id})
                username = user.username if user else "Unknown User"
            except Exception:
                username = "Unknown User"
            
        # Notify channel members that user left
        await self.broadcast_to_channel(channel_id, {
            "type": "user_left",
            "user_id": user_id,
            "username": username,
            "channel_id": channel_id,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_user=user_id)

    async def broadcast_to_channel(self, channel_id: str, message: dict, exclude_user: Optional[str] = None):
        """Broadcast message to all users in a channel"""
        if channel_id not in self.channel_rooms:
            return
            
        # Add exclude_user to message for Redis pub/sub
        if exclude_user:
            message["exclude_user"] = exclude_user
            
        # Publish to Redis for other instances
        await self._publish_to_redis(f"websocket:channel:{channel_id}", message)
        
        # Send to local connections
        message_str = json.dumps(message)
        disconnected_users = []
        
        for user_id in self.channel_rooms[channel_id]:
            if exclude_user and user_id == exclude_user:
                continue
                
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].send_text(message_str)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)

    async def send_to_user(self, user_id: str, message: dict):
        """Send message to a specific user"""
        # Publish to Redis for other instances
        await self._publish_to_redis(f"websocket:user:{user_id}", message)
        
        # Send to local connection if exists
        if user_id in self.active_connections:
            try:
                message_str = json.dumps(message)
                await self.active_connections[user_id].send_text(message_str)
                return True
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                await self.disconnect(user_id)
                return False
        return False

    async def broadcast_new_message(self, channel_id: str, message_data: dict):
        """Broadcast a new message to channel members"""
        await self.broadcast_to_channel(channel_id, {
            "type": "new_message",
            "data": message_data,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def broadcast_message_reaction(self, channel_id: str, message_id: str, reaction_data: dict):
        """Broadcast message reaction to channel members"""
        await self.broadcast_to_channel(channel_id, {
            "type": "message_reaction",
            "message_id": message_id,
            "data": reaction_data,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def broadcast_message_edit(self, channel_id: str, message_data: dict):
        """Broadcast message edit to channel members"""
        await self.broadcast_to_channel(channel_id, {
            "type": "message_edited",
            "data": message_data,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def handle_typing_indicator(self, user_id: str, username: str, channel_id: str, is_typing: bool):
        """Handle typing indicators"""
        if channel_id not in self.typing_users:
            self.typing_users[channel_id] = set()
            
        if is_typing:
            self.typing_users[channel_id].add(user_id)
        else:
            self.typing_users[channel_id].discard(user_id)
            
        # Broadcast typing status to channel
        await self.broadcast_to_channel(channel_id, {
            "type": "typing_indicator",
            "user_id": user_id,
            "username": username,
            "channel_id": channel_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_user=user_id)

    async def get_channel_online_users(self, channel_id: str) -> List[str]:
        """Get list of online users in a channel"""
        if channel_id not in self.channel_rooms:
            return []
            
        online_users = []
        for user_id in self.channel_rooms[channel_id]:
            if user_id in self.active_connections:
                online_users.append(user_id)
                
        return online_users

    async def _broadcast_user_status(self, user_id: str, status: str):
        """Broadcast user online/offline status to relevant channels"""
        # Find all channels the user is part of and broadcast status
        for channel_id, users in self.channel_rooms.items():
            if user_id in users:
                await self.broadcast_to_channel(channel_id, {
                    "type": "user_status",
                    "user_id": user_id,
                    "status": status,
                    "timestamp": datetime.utcnow().isoformat()
                }, exclude_user=user_id)

    async def broadcast_mention_notification(self, user_id: str, message_data: dict):
        """Send mention notification to a specific user"""
        await self.send_to_user(user_id, {
            "type": "mention_notification",
            "data": message_data,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def broadcast_channel_created(self, channel_data: dict):
        """Broadcast new channel creation to all connected users"""
        # Broadcast to all connected users
        message = {
            "type": "channel_created",
            "data": channel_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Publish to Redis for other instances
        await self._publish_to_redis("websocket:global", message)
        
        # Send to all local connections
        message_str = json.dumps(message)
        disconnected_users = []
        
        for user_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message_str)
            except Exception as e:
                logger.error(f"Error sending channel created message to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)

    async def disconnect_user(self, user_id: str):
        """Force disconnect a user (for admin actions like bans)"""
        if user_id in self.active_connections:
            try:
                # Send disconnect message to user
                await self.send_to_user(user_id, {
                    "type": "force_disconnect",
                    "reason": "Account suspended or banned",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Close the WebSocket connection
                websocket = self.active_connections[user_id]
                await websocket.close(code=1008, reason="Account suspended")
                
            except Exception as e:
                logger.error(f"Error force disconnecting user {user_id}: {e}")
            
            # Clean up the connection
            await self.disconnect(user_id)

    async def get_connection_stats(self) -> dict:
        """Get connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "total_channels": len(self.channel_rooms),
            "users_by_channel": {
                channel_id: len(users) 
                for channel_id, users in self.channel_rooms.items()
            }
        }


# Global connection manager instance
connection_manager = ConnectionManager() 