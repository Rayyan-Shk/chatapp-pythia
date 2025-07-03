from typing import List, Optional, Dict, Set
from fastapi import HTTPException, status, Depends
from enum import Enum
from datetime import datetime

from ..models.user import User, Role, UserStatus
from ..models.admin import AdminActionType, AdminTargetType
from ..core.database import prisma
from ..api.auth import get_current_user


class Permission(str, Enum):
    # User Management
    VIEW_USERS = "VIEW_USERS"
    BAN_USERS = "BAN_USERS"
    SUSPEND_USERS = "SUSPEND_USERS"
    ASSIGN_ROLES = "ASSIGN_ROLES"
    KICK_USERS = "KICK_USERS"
    
    # Message Management
    DELETE_MESSAGES = "DELETE_MESSAGES"
    PIN_MESSAGES = "PIN_MESSAGES"
    VIEW_ALL_MESSAGES = "VIEW_ALL_MESSAGES"
    
    # Channel Management
    CREATE_CHANNELS = "CREATE_CHANNELS"
    DELETE_CHANNELS = "DELETE_CHANNELS"
    ARCHIVE_CHANNELS = "ARCHIVE_CHANNELS"
    MANAGE_CHANNEL_SETTINGS = "MANAGE_CHANNEL_SETTINGS"
    
    # System Administration
    VIEW_ADMIN_DASHBOARD = "VIEW_ADMIN_DASHBOARD"
    VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS"
    MANAGE_SYSTEM_SETTINGS = "MANAGE_SYSTEM_SETTINGS"


# Role-based permissions mapping
ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.MEMBER: set(),  # No admin permissions
    
    Role.MODERATOR: {
        Permission.VIEW_USERS,
        Permission.KICK_USERS,
        Permission.DELETE_MESSAGES,
        Permission.PIN_MESSAGES,
        Permission.VIEW_ALL_MESSAGES,
        Permission.VIEW_ADMIN_DASHBOARD,
    },
    
    Role.ADMIN: {
        Permission.VIEW_USERS,
        Permission.BAN_USERS,
        Permission.SUSPEND_USERS,
        Permission.ASSIGN_ROLES,
        Permission.KICK_USERS,
        Permission.DELETE_MESSAGES,
        Permission.PIN_MESSAGES,
        Permission.VIEW_ALL_MESSAGES,
        Permission.CREATE_CHANNELS,
        Permission.DELETE_CHANNELS,
        Permission.ARCHIVE_CHANNELS,
        Permission.MANAGE_CHANNEL_SETTINGS,
        Permission.VIEW_ADMIN_DASHBOARD,
        Permission.VIEW_AUDIT_LOGS,
    },
    
    Role.SUPER_ADMIN: {
        # Super admin has all permissions
        Permission.VIEW_USERS,
        Permission.BAN_USERS,
        Permission.SUSPEND_USERS,
        Permission.ASSIGN_ROLES,
        Permission.KICK_USERS,
        Permission.DELETE_MESSAGES,
        Permission.PIN_MESSAGES,
        Permission.VIEW_ALL_MESSAGES,
        Permission.CREATE_CHANNELS,
        Permission.DELETE_CHANNELS,
        Permission.ARCHIVE_CHANNELS,
        Permission.MANAGE_CHANNEL_SETTINGS,
        Permission.VIEW_ADMIN_DASHBOARD,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MANAGE_SYSTEM_SETTINGS,
    }
}


# Action to permission mapping
ACTION_PERMISSIONS: Dict[AdminActionType, Permission] = {
    AdminActionType.BAN_USER: Permission.BAN_USERS,
    AdminActionType.UNBAN_USER: Permission.BAN_USERS,
    AdminActionType.SUSPEND_USER: Permission.SUSPEND_USERS,
    AdminActionType.UNSUSPEND_USER: Permission.SUSPEND_USERS,
    AdminActionType.DELETE_MESSAGE: Permission.DELETE_MESSAGES,
    AdminActionType.PIN_MESSAGE: Permission.PIN_MESSAGES,
    AdminActionType.UNPIN_MESSAGE: Permission.PIN_MESSAGES,
    AdminActionType.ASSIGN_ROLE: Permission.ASSIGN_ROLES,
    AdminActionType.REMOVE_ROLE: Permission.ASSIGN_ROLES,
    AdminActionType.CREATE_CHANNEL: Permission.CREATE_CHANNELS,
    AdminActionType.DELETE_CHANNEL: Permission.DELETE_CHANNELS,
    AdminActionType.ARCHIVE_CHANNEL: Permission.ARCHIVE_CHANNELS,
    AdminActionType.KICK_USER: Permission.KICK_USERS,
}


class PermissionService:
    """Service for handling role-based permissions"""
    
    @staticmethod
    async def get_user_roles(user_id: str, channel_id: Optional[str] = None) -> List[Role]:
        """Get all roles for a user (global and channel-specific)"""
        where_conditions = {"userId": user_id}
        
        if channel_id:
            where_conditions["OR"] = [
                {"channelId": None},  # Global roles
                {"channelId": channel_id}  # Channel-specific roles
            ]
        else:
            where_conditions["channelId"] = None  # Only global roles
        
        user_roles = await prisma.userrole.find_many(
            where=where_conditions,
            include={"user": True, "channel": True}
        )
        
        return [Role(role.role) for role in user_roles]
    
    @staticmethod
    async def get_highest_role(user_id: str, channel_id: Optional[str] = None) -> Role:
        """Get the highest role for a user"""
        roles = await PermissionService.get_user_roles(user_id, channel_id)
        
        if not roles:
            return Role.MEMBER
        
        # Role hierarchy (highest to lowest)
        role_hierarchy = [Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR, Role.MEMBER]
        
        for role in role_hierarchy:
            if role in roles:
                return role
        
        return Role.MEMBER
    
    @staticmethod
    async def has_permission(
        user_id: str, 
        permission: Permission, 
        channel_id: Optional[str] = None
    ) -> bool:
        """Check if user has a specific permission"""
        highest_role = await PermissionService.get_highest_role(user_id, channel_id)
        user_permissions = ROLE_PERMISSIONS.get(highest_role, set())
        return permission in user_permissions
    
    @staticmethod
    async def can_perform_action(
        user_id: str, 
        action: AdminActionType, 
        channel_id: Optional[str] = None
    ) -> bool:
        """Check if user can perform a specific admin action"""
        required_permission = ACTION_PERMISSIONS.get(action)
        if not required_permission:
            return False
        
        return await PermissionService.has_permission(user_id, required_permission, channel_id)
    
    @staticmethod
    async def can_target_user(admin_user_id: str, target_user_id: str, channel_id: Optional[str] = None) -> bool:
        """Check if admin can perform actions on target user (hierarchy check)"""
        if admin_user_id == target_user_id:
            return False  # Can't target yourself
        
        admin_role = await PermissionService.get_highest_role(admin_user_id, channel_id)
        target_role = await PermissionService.get_highest_role(target_user_id, channel_id)
        
        # Role hierarchy values (higher = more powerful)
        role_values = {
            Role.MEMBER: 0,
            Role.MODERATOR: 1,
            Role.ADMIN: 2,
            Role.SUPER_ADMIN: 3
        }
        
        admin_value = role_values.get(admin_role, 0)
        target_value = role_values.get(target_role, 0)
        
        return admin_value > target_value
    
    @staticmethod
    async def is_user_active(user_id: str) -> bool:
        """Check if user is active (not banned or suspended)"""
        user = await prisma.user.find_unique(where={"id": user_id})
        if not user:
            return False
        
        if user.status == UserStatus.BANNED:
            # Check if ban is still active
            if user.bannedUntil and user.bannedUntil > datetime.utcnow():
                return False
            elif user.bannedUntil is None:  # Permanent ban
                return False
        
        return user.status == UserStatus.ACTIVE


# Dependency functions for FastAPI
def require_permission(permission: Permission, channel_id: Optional[str] = None):
    """Dependency to require a specific permission"""
    async def permission_checker(current_user: User = Depends(get_current_user)):
        if not await PermissionService.has_permission(current_user.id, permission, channel_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {permission.value}"
            )
        return current_user
    return permission_checker


def require_role(required_role: Role, channel_id: Optional[str] = None):
    """Dependency to require a minimum role"""
    async def role_checker(current_user: User = Depends(get_current_user)):
        user_role = await PermissionService.get_highest_role(current_user.id, channel_id)
        
        role_hierarchy = {
            Role.MEMBER: 0,
            Role.MODERATOR: 1,
            Role.ADMIN: 2,
            Role.SUPER_ADMIN: 3
        }
        
        if role_hierarchy.get(user_role, 0) < role_hierarchy.get(required_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient role. Required: {required_role.value}, Current: {user_role.value}"
            )
        return current_user
    return role_checker


async def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require admin or higher role"""
    user_role = await PermissionService.get_highest_role(current_user.id)
    
    if user_role not in [Role.ADMIN, Role.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def require_super_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require super admin role"""
    user_role = await PermissionService.get_highest_role(current_user.id)
    
    if user_role != Role.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user 