from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
import re

from ..core.database import prisma
from ..models.user import User
from ..models.message import (
    Message, MessageCreate, MessageUpdate, MessageWithUser, MessageWithDetails,
    MessageReaction, CreateReactionRequest, MessageFormatter, MessageFormatting
)
from .auth import get_current_user
from ..websocket.connection_manager import connection_manager

router = APIRouter()


async def extract_mentions(content: str) -> List[str]:
    """Extract @mentions from message content"""
    mentions = MessageFormatter.extract_mentions(content)
    
    # Get user IDs for mentioned usernames
    if mentions:
        users = await prisma.user.find_many(
            where={"username": {"in": mentions}}
        )
        return [user.id for user in users]
    
    return []


async def process_message_formatting(content: str) -> tuple[str, MessageFormatting]:
    """Process message content and return sanitized content with formatting metadata"""
    # Validate formatting syntax
    if not MessageFormatter.validate_formatting(content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid formatting syntax. Check your bold (**), code (`), and code block (```) markers."
        )
    
    # Sanitize content while preserving formatting
    sanitized_content = MessageFormatter.sanitize_content(content)
    
    # Parse formatting metadata
    formatting = MessageFormatter.parse_formatting(sanitized_content)
    
    return sanitized_content, formatting


@router.get("/channel/{channel_id}", response_model=List[MessageWithDetails])
async def get_channel_messages(
    channel_id: str,
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0)
):
    """Get messages for a channel"""
    # Check if user is member of the channel
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
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to channel"
        )
    
    messages = await prisma.message.find_many(
        where={"channelId": channel_id},
        include={
            "user": True,
            "reactions": {
                "include": {"user": True}
            },
            "mentions": {
                "include": {"user": True}
            }
        },
        order={"createdAt": "desc"},
        take=limit,
        skip=offset
    )
    
    result = []
    for msg in messages:
        try:
            # Parse formatting for each message
            formatting = MessageFormatter.parse_formatting(msg.content)
            
            # Create message object manually to avoid validation issues
            message_dict = {
                "id": msg.id,
                "content": msg.content,
                "user_id": msg.userId,
                "channel_id": msg.channelId,
                "created_at": msg.createdAt.isoformat() if msg.createdAt else None,
                "updated_at": msg.updatedAt.isoformat() if msg.updatedAt else None,
                "is_edited": msg.isEdited,
                "formatting": formatting.model_dump() if formatting else None,
                "mentions": [mention.user.username for mention in msg.mentions],
                "user": {
                    "id": msg.user.id,
                    "email": msg.user.email,
                    "username": msg.user.username,
                    "avatar": msg.user.avatar,
                    "status": msg.user.status,
                    "banned_until": msg.user.bannedUntil.isoformat() if msg.user.bannedUntil else None,
                    "created_at": msg.user.createdAt.isoformat() if msg.user.createdAt else None,
                    "updated_at": msg.user.updatedAt.isoformat() if msg.user.updatedAt else None
                },
                "reactions": [
                    {
                        "id": reaction.id,
                        "emoji": reaction.emoji,
                        "user_id": reaction.userId,
                        "message_id": reaction.messageId,
                        "created_at": reaction.createdAt.isoformat() if reaction.createdAt else None,
                        "user": {
                            "id": reaction.user.id,
                            "email": reaction.user.email,
                            "username": reaction.user.username,
                            "avatar": reaction.user.avatar,
                            "status": reaction.user.status,
                            "banned_until": reaction.user.bannedUntil.isoformat() if reaction.user.bannedUntil else None,
                            "created_at": reaction.user.createdAt.isoformat() if reaction.user.createdAt else None,
                            "updated_at": reaction.user.updatedAt.isoformat() if reaction.user.updatedAt else None
                        }
                    }
                    for reaction in msg.reactions
                ],
                "mention_count": len(msg.mentions)
            }
            
            result.append(message_dict)
        except Exception as e:
            print(f"Error processing message {msg.id}: {e}")
            continue
    
    return list(reversed(result))  # Return in chronological order


@router.post("/", response_model=MessageWithUser)
async def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new message"""
    try:
        print(f"Creating message for user: {current_user.username} in channel: {message_data.channel_id}")
        
        # Check if user is member of the channel
        member = await prisma.channelmember.find_unique(
            where={
                "userId_channelId": {
                    "userId": current_user.id,
                    "channelId": message_data.channel_id
                }
            }
        )
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Must be a member of the channel to send messages"
            )
        
        # Process message formatting
        sanitized_content, formatting = await process_message_formatting(message_data.content)
        print(f"Processed content: {sanitized_content}")
        
        # Create message
        message = await prisma.message.create(
            data={
                "content": sanitized_content,
                "userId": current_user.id,
                "channelId": message_data.channel_id
            },
            include={"user": True}
        )
        
        print(f"Created message: {message.id}")
        
        # Handle mentions
        mentioned_user_ids = await extract_mentions(sanitized_content)
        if mentioned_user_ids:
            mention_data = [
                {"userId": user_id, "messageId": message.id}
                for user_id in mentioned_user_ids
            ]
            await prisma.mention.create_many(data=mention_data)
            
            # Send mention notifications via WebSocket
            for user_id in mentioned_user_ids:
                await connection_manager.broadcast_mention_notification(user_id, {
                    "message_id": message.id,
                    "channel_id": message_data.channel_id,
                    "content": sanitized_content,
                    "from_user_id": current_user.id,
                    "from_username": current_user.username
                })
        
        # Get mentions for the response
        mentions = await prisma.mention.find_many(
            where={"messageId": message.id},
            include={"user": True}
        )
        
        # Create response object manually to avoid validation issues
        message_response = {
            "id": message.id,
            "content": message.content,
            "user_id": message.userId,
            "channel_id": message.channelId,
            "created_at": message.createdAt.isoformat() if message.createdAt else None,
            "updated_at": message.updatedAt.isoformat() if message.updatedAt else None,
            "is_edited": message.isEdited,
            "formatting": formatting.model_dump() if formatting else None,
            "mentions": [mention.user.username for mention in mentions],
            "reactions": [],  # No reactions yet for new messages
            "user": {
                "id": message.user.id,
                "email": message.user.email,
                "username": message.user.username,
                "avatar": message.user.avatar,
                "status": message.user.status,
                "banned_until": message.user.bannedUntil.isoformat() if message.user.bannedUntil else None,
                "created_at": message.user.createdAt.isoformat() if message.user.createdAt else None,
                "updated_at": message.user.updatedAt.isoformat() if message.user.updatedAt else None
            }
        }
        
        print(f"Prepared response: {message_response['id']}")
        
        # Broadcast new message to channel members via WebSocket
        await connection_manager.broadcast_new_message(
            message_data.channel_id,
            message_response
        )
        
        return message_response
        
    except Exception as e:
        print(f"Error creating message: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create message: {str(e)}"
        )


@router.put("/{message_id}", response_model=MessageWithUser)
async def edit_message(
    message_id: str,
    message_data: MessageUpdate,
    current_user: User = Depends(get_current_user)
):
    """Edit an existing message"""
    # Get the message first
    message = await prisma.message.find_unique(
        where={"id": message_id},
        include={"user": True, "channel": True}
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if user owns the message
    if message.userId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only edit your own messages"
        )
    
    # Check if user is still member of the channel
    member = await prisma.channelmember.find_unique(
        where={
            "userId_channelId": {
                "userId": current_user.id,
                "channelId": message.channelId
            }
        }
    )
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Must be a member of the channel to edit messages"
        )
    
    # Process message formatting
    sanitized_content, formatting = await process_message_formatting(message_data.content)
    
    # Update message content and mark as edited
    updated_message = await prisma.message.update(
        where={"id": message_id},
        data={
            "content": sanitized_content,
            "isEdited": True
        },
        include={"user": True}
    )
    
    # Handle mentions (DRY: reuse existing function)
    # First, remove old mentions
    await prisma.mention.delete_many(where={"messageId": message_id})
    
    # Then add new mentions
    mentioned_user_ids = await extract_mentions(sanitized_content)
    if mentioned_user_ids:
        mention_data = [
            {"userId": user_id, "messageId": message_id}
            for user_id in mentioned_user_ids
        ]
        await prisma.mention.create_many(data=mention_data)
        
        # Send mention notifications via WebSocket (DRY: reuse pattern)
        for user_id in mentioned_user_ids:
            await connection_manager.broadcast_mention_notification(user_id, {
                "message_id": message_id,
                "channel_id": message.channelId,
                "content": sanitized_content,
                "from_user_id": current_user.id,
                "from_username": current_user.username,
                "is_edit": True
            })
    
    # Get mentions for the response
    mentions = await prisma.mention.find_many(
        where={"messageId": message_id},
        include={"user": True}
    )
    
    # Create response object with formatting metadata and mentions
    message_response = {
        "id": updated_message.id,
        "content": updated_message.content,
        "user_id": updated_message.userId,
        "channel_id": updated_message.channelId,
        "created_at": updated_message.createdAt.isoformat() if updated_message.createdAt else None,
        "updated_at": updated_message.updatedAt.isoformat() if updated_message.updatedAt else None,
        "is_edited": updated_message.isEdited,
        "formatting": formatting.model_dump() if formatting else None,
        "mentions": [mention.user.username for mention in mentions],
        "reactions": [],  # Reactions would need to be fetched separately if needed
        "user": {
            "id": updated_message.user.id,
            "email": updated_message.user.email,
            "username": updated_message.user.username,
            "avatar": updated_message.user.avatar,
            "status": updated_message.user.status,
            "banned_until": updated_message.user.bannedUntil.isoformat() if updated_message.user.bannedUntil else None,
            "created_at": updated_message.user.createdAt.isoformat() if updated_message.user.createdAt else None,
            "updated_at": updated_message.user.updatedAt.isoformat() if updated_message.user.updatedAt else None
        }
    }
    
    # Broadcast message edit to channel members via WebSocket
    await connection_manager.broadcast_message_edit(
        message.channelId,
        message_response
    )
    
    return message_response


@router.delete("/{message_id}")
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a message (user can delete own messages)"""
    # Get the message first
    message = await prisma.message.find_unique(
        where={"id": message_id},
        include={"user": True, "channel": True}
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if user owns the message
    if message.userId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own messages"
        )
    
    # Check if user is still member of the channel
    member = await prisma.channelmember.find_unique(
        where={
            "userId_channelId": {
                "userId": current_user.id,
                "channelId": message.channelId
            }
        }
    )
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Must be a member of the channel to delete messages"
        )
    
    # Delete the message (cascades to mentions and reactions)
    await prisma.message.delete(where={"id": message_id})
    
    # Broadcast message deletion via WebSocket (DRY: reuse broadcast pattern)
    await connection_manager.broadcast_to_channel(
        message.channelId,
        {
            "type": "message_deleted",
            "message_id": message_id,
            "deleted_by": current_user.username,
            "channel_id": message.channelId
        }
    )
    
    return {"message": "Message deleted successfully"}


@router.get("/{message_id}", response_model=MessageWithDetails)
async def get_message(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific message"""
    message = await prisma.message.find_unique(
        where={"id": message_id},
        include={
            "user": True,
            "channel": True,
            "reactions": {
                "include": {"user": True}
            },
            "mentions": {
                "include": {"user": True}
            }
        }
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if user has access to the channel
    member = await prisma.channelmember.find_unique(
        where={
            "userId_channelId": {
                "userId": current_user.id,
                "channelId": message.channelId
            }
        }
    )
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to message"
        )
    
    # Parse formatting for the message
    formatting = MessageFormatter.parse_formatting(message.content)
    
    return MessageWithDetails(
        **MessageWithUser(
            **Message.model_validate(message).model_dump(),
            user=User.model_validate(message.user),
            formatting=formatting
        ).model_dump(),
        mentions=[mention.user.username for mention in message.mentions],
        reactions=[
            {
                **MessageReaction.model_validate(reaction).model_dump(),
                "user": User.model_validate(reaction.user)
            }
            for reaction in message.reactions
        ],
        mention_count=len(message.mentions)
    )


@router.post("/reactions", response_model=dict)
async def create_reaction(
    reaction_data: CreateReactionRequest,
    current_user: User = Depends(get_current_user)
):
    """Add reaction to a message"""
    # Check if message exists and user has access
    message = await prisma.message.find_unique(
        where={"id": reaction_data.message_id},
        include={"channel": True}
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check channel access
    member = await prisma.channelmember.find_unique(
        where={
            "userId_channelId": {
                "userId": current_user.id,
                "channelId": message.channelId
            }
        }
    )
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to message"
        )
    
    # Check if reaction already exists
    existing_reaction = await prisma.messagereaction.find_unique(
        where={
            "userId_messageId_emoji": {
                "userId": current_user.id,
                "messageId": reaction_data.message_id,
                "emoji": reaction_data.emoji
            }
        }
    )
    
    if existing_reaction:
        # Remove reaction if it exists
        await prisma.messagereaction.delete(where={"id": existing_reaction.id})
        
        # Broadcast reaction removal via WebSocket
        await connection_manager.broadcast_message_reaction(
            message.channelId,
            reaction_data.message_id,
            {
                "emoji": reaction_data.emoji,
                "user_id": current_user.id,
                "username": current_user.username,
                "action": "remove"
            }
        )
        
        return {"message": "Reaction removed", "action": "remove"}
    else:
        # Add reaction
        new_reaction = await prisma.messagereaction.create(
            data={
                "userId": current_user.id,
                "messageId": reaction_data.message_id,
                "emoji": reaction_data.emoji
            },
            include={"user": True}
        )
        
        # Broadcast reaction addition via WebSocket
        await connection_manager.broadcast_message_reaction(
            message.channelId,
            reaction_data.message_id,
            {
                "emoji": reaction_data.emoji,
                "user_id": current_user.id,
                "username": current_user.username,
                "action": "add"
            }
        )
        
        return {"message": "Reaction added", "action": "add"}


@router.get("/mentions/my", response_model=List[MessageWithDetails])
async def get_my_mentions(
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, le=50)
):
    """Get messages where current user is mentioned"""
    mentions = await prisma.mention.find_many(
        where={"userId": current_user.id},
        include={
            "message": {
                "include": {
                    "user": True,
                    "channel": True,
                    "reactions": {
                        "include": {"user": True}
                    },
                    "mentions": {
                        "include": {"user": True}
                    }
                }
            }
        },
        order_by={"createdAt": "desc"},
        take=limit
    )
    
    result = []
    for mention in mentions:
        msg = mention.message
        # Parse formatting for each message
        formatting = MessageFormatter.parse_formatting(msg.content)
        
        message_with_details = MessageWithDetails(
            **MessageWithUser(
                **Message.model_validate(msg).model_dump(),
                user=User.model_validate(msg.user),
                formatting=formatting
            ).model_dump(),
            mentions=[mention.user.username for mention in msg.mentions],
            reactions=[
                {
                    **MessageReaction.model_validate(reaction).model_dump(),
                    "user": User.model_validate(reaction.user)
                }
                for reaction in msg.reactions
            ],
            mention_count=len(msg.mentions)
        )
        result.append(message_with_details)
    
    return result


@router.post("/format/validate")
async def validate_message_formatting(
    content: str,
    current_user: User = Depends(get_current_user)
):
    """Validate message formatting and return preview"""
    try:
        # Validate formatting syntax
        is_valid = MessageFormatter.validate_formatting(content)
        
        if not is_valid:
            return {
                "valid": False,
                "error": "Invalid formatting syntax. Check your bold (**), code (`), and code block (```) markers.",
                "formatting": None,
                "sanitized_content": None
            }
        
        # Sanitize content and parse formatting
        sanitized_content = MessageFormatter.sanitize_content(content)
        formatting = MessageFormatter.parse_formatting(sanitized_content)
        
        return {
            "valid": True,
            "error": None,
            "formatting": formatting.model_dump(),
            "sanitized_content": sanitized_content,
            "mentions": MessageFormatter.extract_mentions(sanitized_content)
        }
        
    except Exception as e:
        return {
            "valid": False,
            "error": f"Formatting validation error: {str(e)}",
            "formatting": None,
            "sanitized_content": None
        } 