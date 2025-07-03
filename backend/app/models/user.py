from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


class UserBase(BaseModel):
    email: EmailStr
    username: str
    avatar: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    avatar: Optional[str] = None


class UserInDB(UserBase):
    id: str
    password: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    BANNED = "BANNED"


class Role(str, Enum):
    MEMBER = "MEMBER"
    MODERATOR = "MODERATOR"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


class UserRole(BaseModel):
    id: str
    role: Role
    channel_id: Optional[str] = Field(default=None, alias="channelId")
    assigned_at: datetime = Field(alias="assignedAt")
    assigned_by: str = Field(alias="assignedBy")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class User(UserBase):
    id: str
    status: UserStatus = UserStatus.ACTIVE
    banned_until: Optional[datetime] = Field(default=None, alias="bannedUntil")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class UserWithRoles(User):
    roles: List[UserRole] = []


class UserLogin(BaseModel):
    username: str
    password: str


class UserPresence(BaseModel):
    user_id: str
    username: str
    is_online: bool
    last_seen: Optional[datetime] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User 