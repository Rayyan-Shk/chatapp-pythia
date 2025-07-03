from fastapi import APIRouter, HTTPException, Depends, status
from typing import List

from ..core.database import prisma
from ..models.user import User
from ..models.channel import Channel, ChannelCreate, ChannelUpdate, ChannelWithMembers, JoinChannelRequest
from .auth import get_current_user
from ..websocket.connection_manager import connection_manager

router = APIRouter()


@router.get("/", response_model=List[Channel])
async def get_channels(current_user: User = Depends(get_current_user)):
    """Get all channels"""
    try:
        print(f"Getting channels for user: {current_user.username}")
        
        channels = await prisma.channel.find_many()
        
        print(f"Found {len(channels)} channels")
        
        result = []
        for channel in channels:
            try:
                # Use Pydantic model to ensure proper field mapping
                channel_obj = Channel.model_validate(channel)
                result.append(channel_obj)
                print(f"Added channel: {channel.name}")
            except Exception as e:
                print(f"Error processing channel {channel.name}: {e}")
                continue
                
        print(f"Returning {len(result)} channels")
        return result
        
    except Exception as e:
        print(f"Error in get_channels: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get channels: {str(e)}"
        )


@router.get("/my", response_model=List[ChannelWithMembers])
async def get_my_channels(current_user: User = Depends(get_current_user)):
    """Get channels the current user is a member of"""
    try:
        channel_members = await prisma.channelmember.find_many(
            where={"userId": current_user.id},
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
        
        channels = []
        for member in channel_members:
            channel_data = member.channel
            
            # Convert members to User objects
            members = [User.model_validate(m.user) for m in channel_data.members]
            
            # Create ChannelWithMembers using proper model validation
            channel_with_members = ChannelWithMembers(
                **Channel.model_validate(channel_data).model_dump(),
                members=members,
                member_count=len(members)
            )
            
            print(f"Channel: {channel_with_members.name}")
            channels.append(channel_with_members)
        
        return channels
        
    except Exception as e:
        print(f"Error in get_my_channels: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user channels: {str(e)}"
        )


@router.post("/", response_model=Channel)
async def create_channel(
    channel_data: ChannelCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new channel"""
    print(f"🔧 Creating channel: {channel_data.name}")
    print(f"🔧 Channel data: {channel_data.model_dump()}")
    
    # First check if channel already exists to provide better error message
    existing_channel = await prisma.channel.find_first(
        where={"name": channel_data.name}
    )
    
    if existing_channel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Channel name already exists"
        )
    
    try:
        # Create channel with unique constraint handling
        channel = await prisma.channel.create(
            data={
                "name": channel_data.name,
                "description": channel_data.description
            }
        )
        
        print(f"Created channel: {channel.name}")
        
        # Add creator as member
        await prisma.channelmember.create(
            data={
                "userId": current_user.id,
                "channelId": channel.id
            }
        )
        
        # Broadcast new channel creation to all connected users
        channel_dict = Channel.model_validate(channel).model_dump(mode='json')
        await connection_manager.broadcast_channel_created(channel_dict)
        
        # Return JSON-serializable channel
        return Channel.model_validate(channel).model_dump(mode='json')
        
    except Exception as e:
        print(f"Error creating channel: {e}")
        # Check if it's a unique constraint violation
        if "unique" in str(e).lower() or "already exists" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Channel name already exists"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create channel: {str(e)}"
            )


@router.get("/{channel_id}", response_model=ChannelWithMembers)
async def get_channel(
    channel_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get channel by ID"""
    channel = await prisma.channel.find_unique(
        where={"id": channel_id},
        include={
            "members": {
                "include": {"user": True}
            }
        }
    )
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # Check if user is member
    is_member = any(member.userId == current_user.id for member in channel.members)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to channel"
        )
    
    members = [User.model_validate(member.user) for member in channel.members]
    
    return ChannelWithMembers(
        **Channel.model_validate(channel).model_dump(),
        members=members,
        member_count=len(members)
    )


@router.post("/join", response_model=dict)
async def join_channel(
    request: JoinChannelRequest,
    current_user: User = Depends(get_current_user)
):
    """Join a channel"""
    channel = await prisma.channel.find_unique(where={"id": request.channel_id})
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # No restrictions on joining channels
    
    # Check if already a member
    existing_member = await prisma.channelmember.find_unique(
        where={
            "userId_channelId": {
                "userId": current_user.id,
                "channelId": request.channel_id
            }
        }
    )
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already a member of this channel"
        )
    
    # Add user to channel
    await prisma.channelmember.create(
        data={
            "userId": current_user.id,
            "channelId": request.channel_id
        }
    )
    
    # Join WebSocket room if user is connected
    await connection_manager.join_channel(current_user.id, request.channel_id, current_user.username)
    
    return {"message": "Successfully joined channel"}


@router.delete("/{channel_id}/leave", response_model=dict)
async def leave_channel(
    channel_id: str,
    current_user: User = Depends(get_current_user)
):
    """Leave a channel"""
    member = await prisma.channelmember.find_unique(
        where={
            "userId_channelId": {
                "userId": current_user.id,
                "channelId": channel_id
            }
        }
    )
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a member of this channel"
        )
    
    # Remove user from channel
    await prisma.channelmember.delete(
        where={
            "userId_channelId": {
                "userId": current_user.id,
                "channelId": channel_id
            }
        }
    )
    
    # Leave WebSocket room if user is connected
    await connection_manager.leave_channel(current_user.id, channel_id, current_user.username)
    
    return {"message": "Successfully left channel"}


@router.post("/{channel_id}/add-user", response_model=dict)
async def add_user_to_channel(
    channel_id: str,
    request: dict,
    current_user: User = Depends(get_current_user)
):
    user_id = request.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="user_id is required"
        )
    """Add a user to a channel (anyone can do this)"""
    # Get channel
    channel = await prisma.channel.find_unique(
        where={"id": channel_id},
        include={
            "members": {
                "include": {"user": True}
            }
        }
    )
    
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # Check if user exists
    user_to_add = await prisma.user.find_unique(where={"id": user_id})
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is already a member
    existing_member = await prisma.channelmember.find_unique(
        where={
            "userId_channelId": {
                "userId": user_id,
                "channelId": channel_id
            }
        }
    )
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this channel"
        )
    
    # Add user to channel
    await prisma.channelmember.create(
        data={
            "userId": user_id,
            "channelId": channel_id
        }
    )
    
    # Join WebSocket room if user is connected
    await connection_manager.join_channel(user_id, channel_id, user_to_add.username)
    
    return {"message": f"Successfully added {user_to_add.username} to channel"}


@router.get("/users/available", response_model=List[User])
async def get_available_users(
    current_user: User = Depends(get_current_user)
):
    """Get all users available for adding to private channels"""
    try:
        users = await prisma.user.find_many(
            where={
                "id": {"not": current_user.id},  # Exclude current user
                "status": "ACTIVE"  # Only active users
            }
        )
        
        # Sort users by username in Python
        users = sorted(users, key=lambda user: user.username.lower())
        
        return [User.model_validate(user) for user in users]
        
    except Exception as e:
        print(f"Error in get_available_users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get available users: {str(e)}"
        ) 