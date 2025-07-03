from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime
from .message import MessageFormatting


class WebSocketMessage(BaseModel):
    """Base WebSocket message model"""
    type: str
    timestamp: datetime
    data: Optional[Dict[str, Any]] = None


class JoinChannelMessage(BaseModel):
    """Message to join a channel"""
    type: str = "join_channel"
    channel_id: str


class LeaveChannelMessage(BaseModel):
    """Message to leave a channel"""
    type: str = "leave_channel"
    channel_id: str


class TypingIndicatorMessage(BaseModel):
    """Typing indicator message"""
    type: str = "typing_indicator"
    channel_id: str
    is_typing: bool


class NewMessageNotification(BaseModel):
    """New message notification"""
    type: str = "new_message"
    channel_id: str
    message_id: str
    content: str
    user_id: str
    user_username: str
    timestamp: datetime
    formatting: Optional[MessageFormatting] = None


class MessageReactionNotification(BaseModel):
    """Message reaction notification"""
    type: str = "message_reaction"
    message_id: str
    channel_id: str
    emoji: str
    user_id: str
    action: str  # "add" or "remove"


class MessageEditNotification(BaseModel):
    """Message edit notification"""
    type: str = "message_edited"
    message_id: str
    channel_id: str
    content: str
    edited_by: str
    edited_at: datetime
    formatting: Optional[MessageFormatting] = None


class UserStatusNotification(BaseModel):
    """User online/offline status"""
    type: str = "user_status"
    user_id: str
    status: str  # "online" or "offline"


class MentionNotification(BaseModel):
    """Mention notification"""
    type: str = "mention_notification"
    message_id: str
    channel_id: str
    content: str
    from_user_id: str
    from_username: str
    formatting: Optional[MessageFormatting] = None


class ChannelJoinNotification(BaseModel):
    """User joined channel notification"""
    type: str = "user_joined"
    user_id: str
    username: str
    channel_id: str


class ChannelLeaveNotification(BaseModel):
    """User left channel notification"""
    type: str = "user_left"
    user_id: str
    username: str
    channel_id: str


class ErrorMessage(BaseModel):
    """Error message"""
    type: str = "error"
    error_code: str
    message: str
    details: Optional[str] = None


class ConnectionStatsMessage(BaseModel):
    """Connection statistics"""
    type: str = "connection_stats"
    total_connections: int
    total_channels: int
    users_by_channel: Dict[str, int] 