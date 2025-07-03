from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from .user import User


class AdminActionType(str, Enum):
    BAN_USER = "BAN_USER"
    UNBAN_USER = "UNBAN_USER"
    SUSPEND_USER = "SUSPEND_USER"
    UNSUSPEND_USER = "UNSUSPEND_USER"
    DELETE_MESSAGE = "DELETE_MESSAGE"
    PIN_MESSAGE = "PIN_MESSAGE"
    UNPIN_MESSAGE = "UNPIN_MESSAGE"
    ASSIGN_ROLE = "ASSIGN_ROLE"
    REMOVE_ROLE = "REMOVE_ROLE"
    CREATE_CHANNEL = "CREATE_CHANNEL"
    DELETE_CHANNEL = "DELETE_CHANNEL"
    ARCHIVE_CHANNEL = "ARCHIVE_CHANNEL"
    KICK_USER = "KICK_USER"


class AdminTargetType(str, Enum):
    USER = "USER"
    MESSAGE = "MESSAGE"
    CHANNEL = "CHANNEL"
    ROLE = "ROLE"


class AdminAction(BaseModel):
    id: str
    action: AdminActionType
    target_type: AdminTargetType
    target_id: str
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    admin_id: str


class AdminActionWithAdmin(AdminAction):
    admin: User


class AdminActionCreate(BaseModel):
    action: AdminActionType
    target_type: AdminTargetType
    target_id: str
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CreateAdminActionRequest(BaseModel):
    action: AdminActionType
    target_type: AdminTargetType
    target_id: str
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class BanUserRequest(BaseModel):
    user_id: str
    reason: Optional[str] = None
    duration_hours: Optional[int] = None  # None = permanent ban


class SuspendUserRequest(BaseModel):
    user_id: str
    reason: Optional[str] = None
    duration_hours: int = 24  # Default 24 hours


class AssignRoleRequest(BaseModel):
    user_id: str
    role: str
    channel_id: Optional[str] = None


class RemoveRoleRequest(BaseModel):
    user_id: str
    role: str
    channel_id: Optional[str] = None


class KickUserRequest(BaseModel):
    user_id: str
    channel_id: str
    reason: Optional[str] = None


class DeleteMessageRequest(BaseModel):
    message_id: str
    reason: Optional[str] = None


class PinMessageRequest(BaseModel):
    message_id: str
    reason: Optional[str] = None


class CreateChannelRequest(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True
    reason: Optional[str] = None


class DeleteChannelRequest(BaseModel):
    channel_id: str
    reason: Optional[str] = None


class ArchiveChannelRequest(BaseModel):
    channel_id: str
    reason: Optional[str] = None


class BulkActionRequest(BaseModel):
    action: AdminActionType
    target_ids: List[str]
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class BulkActionResult(BaseModel):
    successful: List[str]
    failed: List[Dict[str, str]]  # {"target_id": "error_message"}
    total_processed: int


class AdminDashboardStats(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    banned_users: int
    total_channels: int
    public_channels: int
    private_channels: int
    total_messages: int
    messages_today: int
    recent_actions: List[AdminActionWithAdmin]


class UserSummary(BaseModel):
    id: str
    username: str
    email: str
    status: str
    banned_until: Optional[datetime] = None
    message_count: int
    channel_count: int
    created_at: datetime
    last_active: Optional[datetime] = None


class ChannelSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_public: bool
    member_count: int
    message_count: int
    created_at: datetime


class UserWithRoles(BaseModel):
    id: str
    username: str
    email: str
    status: str
    created_at: datetime
    banned_until: Optional[datetime] = None
    roles: List[Dict[str, Any]]  # Role information with channel context 