#!/usr/bin/env python3
"""
Utility script to create admin users and test the admin system
"""
import asyncio
import sys
import os
from datetime import datetime

# Add the parent directory to the path so we can import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import connect_db, disconnect_db, prisma
from app.core.auth import get_password_hash
from app.models.user import Role, UserStatus


async def create_admin_user(username: str, email: str, password: str, role: Role = Role.SUPER_ADMIN):
    """Create an admin user"""
    await connect_db()
    
    try:
        # Check if user already exists
        existing_user = await prisma.user.find_first(
            where={
                "OR": [
                    {"username": username},
                    {"email": email}
                ]
            }
        )
        
        if existing_user:
            print(f"❌ User with username '{username}' or email '{email}' already exists")
            return None
        
        # Create the user
        hashed_password = get_password_hash(password)
        user = await prisma.user.create(
            data={
                "username": username,
                "email": email,
                "password": hashed_password,
                "status": UserStatus.ACTIVE
            }
        )
        
        print(f"✅ Created user: {username} ({email})")
        
        # Assign admin role
        role_assignment = await prisma.userrole.create(
            data={
                "userId": user.id,
                "role": role,
                "channelId": None,  # Global role
                "assignedBy": user.id  # Self-assigned for initial admin
            }
        )
        
        print(f"✅ Assigned {role.value} role to {username}")
        
        return user
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return None
    
    finally:
        await disconnect_db()


async def list_users_with_roles():
    """List all users and their roles"""
    await connect_db()
    
    try:
        users = await prisma.user.find_many(
            include={
                "roles": {
                    "include": {"channel": True}
                }
            },
            order_by={"createdAt": "asc"}
        )
        
        print("\n" + "="*80)
        print("USER MANAGEMENT DASHBOARD")
        print("="*80)
        
        for user in users:
            print(f"\n👤 {user.username} ({user.email})")
            print(f"   Status: {user.status}")
            print(f"   Created: {user.createdAt.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if user.bannedUntil:
                print(f"   ⚠️  Banned until: {user.bannedUntil.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if user.roles:
                print("   Roles:")
                for role in user.roles:
                    scope = f"in #{role.channel.name}" if role.channel else "Global"
                    print(f"     • {role.role} ({scope})")
            else:
                print("   Roles: Member (default)")
        
        print("\n" + "="*80)
        
    except Exception as e:
        print(f"❌ Error listing users: {e}")
    
    finally:
        await disconnect_db()


async def test_permission_system():
    """Test the permission system"""
    from app.core.permissions import PermissionService, Permission
    
    await connect_db()
    
    try:
        # Get all users
        users = await prisma.user.find_many(
            include={"roles": True}
        )
        
        print("\n" + "="*80)
        print("PERMISSION SYSTEM TEST")
        print("="*80)
        
        for user in users:
            print(f"\n🔐 Testing permissions for {user.username}:")
            
            # Test various permissions
            permissions_to_test = [
                Permission.VIEW_USERS,
                Permission.BAN_USERS,
                Permission.DELETE_MESSAGES,
                Permission.VIEW_ADMIN_DASHBOARD,
                Permission.MANAGE_SYSTEM_SETTINGS
            ]
            
            for permission in permissions_to_test:
                has_permission = await PermissionService.has_permission(
                    user.id, permission
                )
                status = "✅" if has_permission else "❌"
                print(f"   {status} {permission.value}")
            
            # Get highest role
            highest_role = await PermissionService.get_highest_role(user.id)
            print(f"   🎭 Highest Role: {highest_role.value}")
        
        print("\n" + "="*80)
        
    except Exception as e:
        print(f"❌ Error testing permissions: {e}")
    
    finally:
        await disconnect_db()


async def create_sample_admin_action():
    """Create a sample admin action for testing"""
    await connect_db()
    
    try:
        # Find an admin user
        admin_user = await prisma.user.find_first(
            where={
                "roles": {
                    "some": {
                        "role": {"in": [Role.ADMIN, Role.SUPER_ADMIN]}
                    }
                }
            },
            include={"roles": True}
        )
        
        if not admin_user:
            print("❌ No admin user found. Create an admin user first.")
            return
        
        # Create a sample admin action
        from app.models.admin import AdminActionType, AdminTargetType
        
        action = await prisma.adminaction.create(
            data={
                "action": AdminActionType.ASSIGN_ROLE,
                "targetType": AdminTargetType.USER,
                "targetId": admin_user.id,
                "reason": "Initial system setup",
                "adminId": admin_user.id,
                "metadata": {"test": True}
            }
        )
        
        print(f"✅ Created sample admin action: {action.id}")
        
    except Exception as e:
        print(f"❌ Error creating admin action: {e}")
    
    finally:
        await disconnect_db()


async def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python scripts/create_admin.py create <username> <email> <password> [role]")
        print("  python scripts/create_admin.py list")
        print("  python scripts/create_admin.py test")
        print("  python scripts/create_admin.py sample-action")
        print("\nRoles: MEMBER, MODERATOR, ADMIN, SUPER_ADMIN")
        return
    
    command = sys.argv[1]
    
    if command == "create":
        if len(sys.argv) < 5:
            print("Usage: python scripts/create_admin.py create <username> <email> <password> [role]")
            return
        
        username = sys.argv[2]
        email = sys.argv[3]
        password = sys.argv[4]
        role = Role.SUPER_ADMIN
        
        if len(sys.argv) > 5:
            try:
                role = Role(sys.argv[5].upper())
            except ValueError:
                print(f"Invalid role: {sys.argv[5]}")
                print("Valid roles: MEMBER, MODERATOR, ADMIN, SUPER_ADMIN")
                return
        
        await create_admin_user(username, email, password, role)
    
    elif command == "list":
        await list_users_with_roles()
    
    elif command == "test":
        await test_permission_system()
    
    elif command == "sample-action":
        await create_sample_admin_action()
    
    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    asyncio.run(main()) 