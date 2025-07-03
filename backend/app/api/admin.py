from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from datetime import datetime, timedelta

from ..core.database import prisma
from ..core.permissions import (
    require_admin, require_super_admin, require_permission, PermissionService, Permission
)
from ..models.user import User, Role, UserStatus, UserWithRoles
from ..models.admin import (
    AdminAction, AdminActionWithAdmin, CreateAdminActionRequest,
    BanUserRequest, SuspendUserRequest, AssignRoleRequest, RemoveRoleRequest,
    KickUserRequest, DeleteMessageRequest, PinMessageRequest,
    CreateChannelRequest, DeleteChannelRequest, ArchiveChannelRequest,
    UserSummary, ChannelSummary, AdminDashboardStats, BulkActionRequest, BulkActionResult,
    AdminActionType, AdminTargetType
)
from ..websocket.connection_manager import connection_manager

router = APIRouter()


# Dashboard and Statistics
@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_admin_dashboard(current_user: User = Depends(require_admin)):
    """Get admin dashboard statistics"""
    # Get user counts
    total_users = await prisma.user.count()
    active_users = await prisma.user.count(where={"status": UserStatus.ACTIVE})
    suspended_users = await prisma.user.count(where={"status": UserStatus.SUSPENDED})
    banned_users = await prisma.user.count(where={"status": UserStatus.BANNED})
    
    # Get channel counts
    total_channels = await prisma.channel.count()
    
    # Get message counts
    total_messages = await prisma.message.count()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today = await prisma.message.count(
        where={"createdAt": {"gte": today}}
    )
    
    # Get recent admin actions
    recent_actions_data = await prisma.adminaction.find_many(
        take=10,
        order_by={"createdAt": "desc"},
        include={"admin": True}
    )
    
    recent_actions = [
        AdminActionWithAdmin(
            **AdminAction.model_validate(action).model_dump(),
            admin=User.model_validate(action.admin)
        )
        for action in recent_actions_data
    ]
    
    return AdminDashboardStats(
        total_users=total_users,
        active_users=active_users,
        suspended_users=suspended_users,
        banned_users=banned_users,
        total_channels=total_channels,
        public_channels=None,
        private_channels=None,
        total_messages=total_messages,
        messages_today=messages_today,
        recent_actions=recent_actions
    )


# User Management
@router.get("/users", response_model=List[UserSummary])
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[UserStatus] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_permission(Permission.VIEW_USERS))
):
    """Get users with pagination and filtering"""
    skip = (page - 1) * limit
    where_conditions = {}
    
    if status:
        where_conditions["status"] = status
    
    if search:
        where_conditions["OR"] = [
            {"username": {"contains": search, "mode": "insensitive"}},
            {"email": {"contains": search, "mode": "insensitive"}}
        ]
    
    users = await prisma.user.find_many(
        where=where_conditions,
        skip=skip,
        take=limit,
        order_by={"createdAt": "desc"},
        include={
            "_count": {
                "select": {
                    "messages": True,
                    "channelMembers": True
                }
            }
        }
    )
    
    return [
        UserSummary(
            id=user.id,
            username=user.username,
            email=user.email,
            status=UserStatus(user.status),
            banned_until=user.bannedUntil,
            message_count=user._count.messages,
            channel_count=user._count.channelMembers,
            created_at=user.createdAt,
            last_active=None  # TODO: Implement last activity tracking
        )
        for user in users
    ]


@router.get("/users/{user_id}", response_model=UserWithRoles)
async def get_user_details(
    user_id: str,
    current_user: User = Depends(require_permission(Permission.VIEW_USERS))
):
    """Get detailed user information including roles"""
    user = await prisma.user.find_unique(
        where={"id": user_id},
        include={
            "roles": {
                "include": {"channel": True, "assigner": True}
            }
        }
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_roles = [
        {
            "id": role.id,
            "role": role.role,
            "channel_id": role.channelId,
            "assigned_at": role.assignedAt,
            "assigned_by": role.assignedBy
        }
        for role in user.roles
    ]
    
    return UserWithRoles(
        **User.model_validate(user).model_dump(),
        roles=user_roles
    )


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    request: BanUserRequest,
    current_user: User = Depends(require_permission(Permission.BAN_USERS))
):
    """Ban a user"""
    # Check if admin can target this user
    if not await PermissionService.can_target_user(current_user.id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot ban user with equal or higher role"
        )
    
    # Calculate ban expiry
    banned_until = None
    if request.duration_hours:
        banned_until = datetime.utcnow() + timedelta(hours=request.duration_hours)
    
    # Update user status
    user = await prisma.user.update(
        where={"id": user_id},
        data={
            "status": UserStatus.BANNED,
            "bannedUntil": banned_until
        }
    )
    
    # Log admin action
    await prisma.adminaction.create(
        data={
            "action": AdminActionType.BAN_USER,
            "targetType": AdminTargetType.USER,
            "targetId": user_id,
            "reason": request.reason,
            "adminId": current_user.id,
            "metadata": {"duration_hours": request.duration_hours}
        }
    )
    
    # Disconnect user from WebSocket
    await connection_manager.disconnect_user(user_id)
    
    return {"message": "User banned successfully"}


@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: str,
    reason: Optional[str] = None,
    current_user: User = Depends(require_permission(Permission.BAN_USERS))
):
    """Unban a user"""
    # Update user status
    user = await prisma.user.update(
        where={"id": user_id},
        data={
            "status": UserStatus.ACTIVE,
            "bannedUntil": None
        }
    )
    
    # Log admin action
    await prisma.adminaction.create(
        data={
            "action": AdminActionType.UNBAN_USER,
            "targetType": AdminTargetType.USER,
            "targetId": user_id,
            "reason": reason,
            "adminId": current_user.id
        }
    )
    
    return {"message": "User unbanned successfully"}


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    request: SuspendUserRequest,
    current_user: User = Depends(require_permission(Permission.SUSPEND_USERS))
):
    """Suspend a user temporarily"""
    # Check if admin can target this user
    if not await PermissionService.can_target_user(current_user.id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot suspend user with equal or higher role"
        )
    
    # Calculate suspension expiry
    banned_until = datetime.utcnow() + timedelta(hours=request.duration_hours)
    
    # Update user status
    user = await prisma.user.update(
        where={"id": user_id},
        data={
            "status": UserStatus.SUSPENDED,
            "bannedUntil": banned_until
        }
    )
    
    # Log admin action
    await prisma.adminaction.create(
        data={
            "action": AdminActionType.SUSPEND_USER,
            "targetType": AdminTargetType.USER,
            "targetId": user_id,
            "reason": request.reason,
            "adminId": current_user.id,
            "metadata": {"duration_hours": request.duration_hours}
        }
    )
    
    # Disconnect user from WebSocket
    await connection_manager.disconnect_user(user_id)
    
    return {"message": "User suspended successfully"}


@router.post("/users/{user_id}/roles")
async def assign_role(
    user_id: str,
    request: AssignRoleRequest,
    current_user: User = Depends(require_permission(Permission.ASSIGN_ROLES))
):
    """Assign a role to a user"""
    # Check if admin can assign this role
    admin_role = await PermissionService.get_highest_role(current_user.id)
    
    role_hierarchy = {
        Role.MEMBER: 0,
        Role.MODERATOR: 1,
        Role.ADMIN: 2,
        Role.SUPER_ADMIN: 3
    }
    
    if role_hierarchy.get(request.role, 0) >= role_hierarchy.get(admin_role, 0):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot assign role equal to or higher than your own"
        )
    
    # Check if role assignment already exists
    existing_role = await prisma.userrole.find_unique(
        where={
            "userId_role_channelId": {
                "userId": user_id,
                "role": request.role,
                "channelId": request.channel_id
            }
        }
    )
    
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has this role"
        )
    
    # Create role assignment
    role = await prisma.userrole.create(
        data={
            "userId": user_id,
            "role": request.role,
            "channelId": request.channel_id,
            "assignedBy": current_user.id
        }
    )
    
    # Log admin action
    await prisma.adminaction.create(
        data={
            "action": AdminActionType.ASSIGN_ROLE,
            "targetType": AdminTargetType.ROLE,
            "targetId": role.id,
            "reason": request.reason,
            "adminId": current_user.id,
            "metadata": {
                "user_id": user_id,
                "role": request.role,
                "channel_id": request.channel_id
            }
        }
    )
    
    return {"message": "Role assigned successfully"}


@router.delete("/users/{user_id}/roles")
async def remove_role(
    user_id: str,
    request: RemoveRoleRequest,
    current_user: User = Depends(require_permission(Permission.ASSIGN_ROLES))
):
    """Remove a role from a user"""
    # Find the role to remove
    role = await prisma.userrole.find_unique(
        where={
            "userId_role_channelId": {
                "userId": user_id,
                "role": request.role,
                "channelId": request.channel_id
            }
        }
    )
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role assignment not found"
        )
    
    # Remove role
    await prisma.userrole.delete(where={"id": role.id})
    
    # Log admin action
    await prisma.adminaction.create(
        data={
            "action": AdminActionType.REMOVE_ROLE,
            "targetType": AdminTargetType.ROLE,
            "targetId": role.id,
            "reason": request.reason,
            "adminId": current_user.id,
            "metadata": {
                "user_id": user_id,
                "role": request.role,
                "channel_id": request.channel_id
            }
        }
    )
    
    return {"message": "Role removed successfully"}


# Message Moderation
@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    request: DeleteMessageRequest,
    current_user: User = Depends(require_permission(Permission.DELETE_MESSAGES))
):
    """Delete a message"""
    # Get message details
    message = await prisma.message.find_unique(
        where={"id": message_id},
        include={"user": True, "channel": True}
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if admin can moderate this channel
    # No restrictions: all admins can moderate any channel
    
    # Delete message
    await prisma.message.delete(where={"id": message_id})
    
    # Log admin action
    await prisma.adminaction.create(
        data={
            "action": AdminActionType.DELETE_MESSAGE,
            "targetType": AdminTargetType.MESSAGE,
            "targetId": message_id,
            "reason": request.reason,
            "adminId": current_user.id,
            "metadata": {
                "message_content": message.content,
                "author_id": message.userId,
                "channel_id": message.channelId
            }
        }
    )
    
    # Broadcast message deletion via WebSocket
    await connection_manager.broadcast_to_channel(
        message.channelId,
        {
            "type": "message_deleted",
            "message_id": message_id,
            "deleted_by": current_user.username,
            "reason": request.reason
        }
    )
    
    return {"message": "Message deleted successfully"}


# Audit Logs
@router.get("/actions", response_model=List[AdminActionWithAdmin])
async def get_admin_actions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    action_type: Optional[AdminActionType] = None,
    target_type: Optional[AdminTargetType] = None,
    admin_id: Optional[str] = None,
    current_user: User = Depends(require_permission(Permission.VIEW_AUDIT_LOGS))
):
    """Get admin action logs with filtering"""
    skip = (page - 1) * limit
    where_conditions = {}
    
    if action_type:
        where_conditions["action"] = action_type
    
    if target_type:
        where_conditions["targetType"] = target_type
    
    if admin_id:
        where_conditions["adminId"] = admin_id
    
    actions = await prisma.adminaction.find_many(
        where=where_conditions,
        skip=skip,
        take=limit,
        order_by={"createdAt": "desc"},
        include={"admin": True}
    )
    
    return [
        AdminActionWithAdmin(
            **AdminAction.model_validate(action).model_dump(),
            admin=User.model_validate(action.admin)
        )
        for action in actions
    ]


# Bulk Operations
@router.post("/bulk-actions", response_model=BulkActionResult)
async def perform_bulk_action(
    request: BulkActionRequest,
    current_user: User = Depends(require_super_admin)
):
    """Perform bulk admin actions (Super Admin only)"""
    success_count = 0
    failure_count = 0
    errors = []
    action_ids = []
    
    for target_id in request.target_ids:
        try:
            # Check permissions for each target
            if request.action in [AdminActionType.BAN_USER, AdminActionType.SUSPEND_USER]:
                if not await PermissionService.can_target_user(current_user.id, target_id):
                    errors.append(f"Cannot target user {target_id}: insufficient permissions")
                    failure_count += 1
                    continue
            
            # Perform the action based on type
            if request.action == AdminActionType.BAN_USER:
                await prisma.user.update(
                    where={"id": target_id},
                    data={"status": UserStatus.BANNED}
                )
                await connection_manager.disconnect_user(target_id)
            
            elif request.action == AdminActionType.DELETE_MESSAGE:
                await prisma.message.delete(where={"id": target_id})
            
            # Log the action
            action = await prisma.adminaction.create(
                data={
                    "action": request.action,
                    "targetType": AdminTargetType.USER if "USER" in request.action.value else AdminTargetType.MESSAGE,
                    "targetId": target_id,
                    "reason": request.reason,
                    "adminId": current_user.id,
                    "metadata": request.metadata
                }
            )
            
            action_ids.append(action.id)
            success_count += 1
            
        except Exception as e:
            errors.append(f"Failed to process {target_id}: {str(e)}")
            failure_count += 1
    
    return BulkActionResult(
        success_count=success_count,
        failure_count=failure_count,
        errors=errors,
        action_ids=action_ids
    ) 