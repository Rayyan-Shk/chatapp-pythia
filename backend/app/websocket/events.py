from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import HTTPBearer
import json
import logging
from typing import Dict, Any

from .connection_manager import connection_manager
from ..models.websocket import (
    JoinChannelMessage, LeaveChannelMessage, TypingIndicatorMessage, ErrorMessage
)
from ..models.user import User
from ..core.database import prisma
from ..core.auth import verify_token

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def get_user_from_token(token: str) -> User:
    """Get user from JWT token for WebSocket authentication"""
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user_record = await prisma.user.find_unique(where={"id": user_id})
    if user_record is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Convert Prisma user to Pydantic User model
    user_data = {
        "id": user_record.id,
        "email": user_record.email,
        "username": user_record.username,
        "avatar": user_record.avatar,
        "status": user_record.status,
        "banned_until": user_record.bannedUntil,
        "created_at": user_record.createdAt,
        "updated_at": user_record.updatedAt,
    }
    
    return User(**user_data)


class WebSocketHandler:
    """Handles WebSocket events and message routing"""
    
    def __init__(self, websocket: WebSocket, user: User):
        self.websocket = websocket
        self.user = user
        self.user_id = user.id

    async def handle_connection(self):
        """Handle WebSocket connection lifecycle"""
        try:
            # Connect user
            await connection_manager.connect(self.websocket, self.user_id)
            
            # Auto-join user to their channels
            await self._auto_join_user_channels()
            
            # Send welcome message
            await self._send_welcome_message()
            
            # Handle incoming messages
            await self._message_loop()
            
        except WebSocketDisconnect:
            logger.info(f"User {self.user_id} disconnected")
        except Exception as e:
            logger.error(f"WebSocket error for user {self.user_id}: {e}")
        finally:
            await connection_manager.disconnect(self.user_id)

    async def _auto_join_user_channels(self):
        """Automatically join user to their channels"""
        try:
            # Get user's channels
            channel_members = await prisma.channelmember.find_many(
                where={"userId": self.user_id},
                include={"channel": True}
            )
            
            for member in channel_members:
                channel_id = member.channel.id
                await connection_manager.join_channel(self.user_id, channel_id, self.user.username)
                
        except Exception as e:
            logger.error(f"Error auto-joining channels for user {self.user_id}: {e}")

    async def _send_welcome_message(self):
        """Send welcome message to connected user"""
        welcome_data = {
            "type": "connection_established",
            "user_id": self.user_id,
            "username": self.user.username,
            "timestamp": connection_manager.user_presence[self.user_id].isoformat()
        }
        await connection_manager.send_to_user(self.user_id, welcome_data)

    async def _message_loop(self):
        """Main message handling loop"""
        while True:
            try:
                # Receive message from client
                data = await self.websocket.receive_text()
                message_data = json.loads(data)
                
                # Route message based on type
                await self._route_message(message_data)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await self._send_error("invalid_json", "Invalid JSON format")
            except Exception as e:
                logger.error(f"Error handling message from user {self.user_id}: {e}")
                await self._send_error("internal_error", "Internal server error")

    async def _route_message(self, message_data: Dict[str, Any]):
        """Route incoming message to appropriate handler"""
        message_type = message_data.get("type")
        
        if message_type == "join_channel":
            await self._handle_join_channel(message_data)
        elif message_type == "leave_channel":
            await self._handle_leave_channel(message_data)
        elif message_type == "typing_indicator":
            await self._handle_typing_indicator(message_data)
        elif message_type == "ping":
            await self._handle_ping()
        elif message_type == "get_online_users":
            await self._handle_get_online_users(message_data)
        else:
            await self._send_error("unknown_message_type", f"Unknown message type: {message_type}")

    async def _handle_join_channel(self, message_data: Dict[str, Any]):
        """Handle join channel request"""
        try:
            join_message = JoinChannelMessage(**message_data)
            channel_id = join_message.channel_id
            
            # Verify user has access to channel
            member = await prisma.channelmember.find_unique(
                where={
                    "userId_channelId": {
                        "userId": self.user_id,
                        "channelId": channel_id
                    }
                }
            )
            
            if not member:
                # Check if channel exists
                channel = await prisma.channel.find_unique(where={"id": channel_id})
                if not channel:
                    await self._send_error("access_denied", "Channel not found")
                    return
                
                # Channel exists but user is not a member - this is an access denied case
                await self._send_error("access_denied", "Access denied to channel")
                return
            
            # Join the channel room
            await connection_manager.join_channel(self.user_id, channel_id, self.user.username)
            
            # Send confirmation
            await connection_manager.send_to_user(self.user_id, {
                "type": "channel_joined",
                "channel_id": channel_id,
                "timestamp": connection_manager.user_presence[self.user_id].isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error joining channel: {e}")
            await self._send_error("join_channel_error", str(e))

    async def _handle_leave_channel(self, message_data: Dict[str, Any]):
        """Handle leave channel request"""
        try:
            leave_message = LeaveChannelMessage(**message_data)
            channel_id = leave_message.channel_id
            
            # Leave the channel room
            await connection_manager.leave_channel(self.user_id, channel_id, self.user.username)
            
            # Send confirmation
            await connection_manager.send_to_user(self.user_id, {
                "type": "channel_left",
                "channel_id": channel_id,
                "timestamp": connection_manager.user_presence[self.user_id].isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error leaving channel: {e}")
            await self._send_error("leave_channel_error", str(e))

    async def _handle_typing_indicator(self, message_data: Dict[str, Any]):
        """Handle typing indicator"""
        try:
            typing_message = TypingIndicatorMessage(**message_data)
            
            await connection_manager.handle_typing_indicator(
                self.user_id,
                self.user.username,
                typing_message.channel_id,
                typing_message.is_typing
            )
            
        except Exception as e:
            logger.error(f"Error handling typing indicator: {e}")
            await self._send_error("typing_indicator_error", str(e))

    async def _handle_ping(self):
        """Handle ping message for connection health check"""
        await connection_manager.send_to_user(self.user_id, {
            "type": "pong",
            "timestamp": connection_manager.user_presence[self.user_id].isoformat()
        })

    async def _handle_get_online_users(self, message_data: Dict[str, Any]):
        """Handle request for online users in a channel"""
        try:
            channel_id = message_data.get("channel_id")
            if not channel_id:
                await self._send_error("missing_channel_id", "Channel ID is required")
                return
            
            online_users = await connection_manager.get_channel_online_users(channel_id)
            
            await connection_manager.send_to_user(self.user_id, {
                "type": "online_users",
                "channel_id": channel_id,
                "users": online_users,
                "timestamp": connection_manager.user_presence[self.user_id].isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error getting online users: {e}")
            await self._send_error("get_online_users_error", str(e))

    async def _send_error(self, error_code: str, message: str, details: str = None):
        """Send error message to user"""
        error_msg = ErrorMessage(
            error_code=error_code,
            message=message,
            details=details
        )
        await connection_manager.send_to_user(self.user_id, error_msg.model_dump())


async def websocket_endpoint(websocket: WebSocket, token: str):
    """Main WebSocket endpoint"""
    try:
        # Authenticate user
        user = await get_user_from_token(token)
        
        # Handle connection
        handler = WebSocketHandler(websocket, user)
        await handler.handle_connection()
        
    except HTTPException as e:
        await websocket.close(code=1008, reason=e.detail)
    except Exception as e:
        logger.error(f"WebSocket endpoint error: {e}")
        await websocket.close(code=1011, reason="Internal server error") 