from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from .user import User


class ChannelBase(BaseModel):
    name: str
    description: Optional[str] = None


class ChannelCreate(ChannelBase):
    pass


class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class Channel(ChannelBase):
    id: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class ChannelWithMembers(Channel):
    members: List[User] = []
    member_count: int = 0


class ChannelMemberBase(BaseModel):
    user_id: str
    channel_id: str


class ChannelMember(ChannelMemberBase):
    id: str
    joined_at: datetime = Field(alias="joinedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class JoinChannelRequest(BaseModel):
    channel_id: str


class AddUserToChannelRequest(BaseModel):
    user_id: str 