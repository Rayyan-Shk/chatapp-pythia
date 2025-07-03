# Admin System Documentation

## Overview

The Pythia Conversations admin system provides comprehensive role-based access control and moderation capabilities. It includes user management, content moderation, audit logging, and real-time administrative actions.

## Architecture

### Core Components

1. **Role-Based Access Control (RBAC)**
   - Hierarchical role system: Member → Moderator → Admin → Super Admin
   - Permission-based authorization
   - Global and channel-specific roles

2. **Admin Models**
   - User management models
   - Admin action tracking
   - Audit logging system

3. **Permission System**
   - Fine-grained permissions
   - Role hierarchy enforcement
   - Action-based authorization

4. **WebSocket Integration**
   - Real-time admin actions
   - Force disconnect capabilities
   - Live moderation events

## Role Hierarchy

### Member (Default)

- No administrative permissions
- Basic chat functionality only

### Moderator

- **User Management**: View users, kick users
- **Message Moderation**: Delete messages, pin messages
- **Monitoring**: View admin dashboard
- **Scope**: Usually channel-specific

### Admin

- **All Moderator permissions**
- **User Management**: Ban/suspend users, assign roles
- **Channel Management**: Create/delete channels, manage settings
- **Audit Access**: View audit logs
- **Scope**: Global or channel-specific

### Super Admin

- **All Admin permissions**
- **System Administration**: Manage system settings
- **Bulk Operations**: Perform bulk actions
- **Ultimate Authority**: Cannot be targeted by other admins

## Database Schema

### User Table Extensions

```sql
-- New fields added to users table
status          UserStatus   DEFAULT 'ACTIVE'
bannedUntil     DateTime?    -- NULL for permanent bans
```

### New Tables

#### UserRole

```sql
id          String    PRIMARY KEY
role        Role      -- MEMBER, MODERATOR, ADMIN, SUPER_ADMIN
channelId   String?   -- NULL for global roles
assignedAt  DateTime
assignedBy  String    -- Who assigned the role
userId      String    FOREIGN KEY
```

#### AdminAction

```sql
id         String           PRIMARY KEY
action     AdminActionType  -- BAN_USER, DELETE_MESSAGE, etc.
targetType AdminTargetType  -- USER, MESSAGE, CHANNEL, ROLE
targetId   String           -- ID of the target
reason     String?          -- Optional reason
metadata   Json?            -- Additional action data
createdAt  DateTime
adminId    String           FOREIGN KEY
```

## API Endpoints

### Admin Dashboard

```
GET /api/v1/admin/dashboard
```

Returns comprehensive statistics and recent actions.

### User Management

```
GET    /api/v1/admin/users              # List users with filtering
GET    /api/v1/admin/users/{user_id}    # Get user details
POST   /api/v1/admin/users/{user_id}/ban
POST   /api/v1/admin/users/{user_id}/unban
POST   /api/v1/admin/users/{user_id}/suspend
POST   /api/v1/admin/users/{user_id}/roles     # Assign role
DELETE /api/v1/admin/users/{user_id}/roles     # Remove role
```

### Message Moderation

```
DELETE /api/v1/admin/messages/{message_id}     # Delete message
```

### Audit Logs

```
GET /api/v1/admin/actions                      # Get admin actions
```

### Bulk Operations

```
POST /api/v1/admin/bulk-actions                # Bulk admin actions
```

## Permission System

### Permissions List

#### User Management

- `VIEW_USERS`: View user list and details
- `BAN_USERS`: Ban/unban users
- `SUSPEND_USERS`: Suspend users temporarily
- `ASSIGN_ROLES`: Assign/remove roles
- `KICK_USERS`: Kick users from channels

#### Message Management

- `DELETE_MESSAGES`: Delete any message
- `PIN_MESSAGES`: Pin/unpin messages
- `VIEW_ALL_MESSAGES`: Access all messages

#### Channel Management

- `CREATE_CHANNELS`: Create new channels
- `DELETE_CHANNELS`: Delete channels
- `ARCHIVE_CHANNELS`: Archive channels
- `MANAGE_CHANNEL_SETTINGS`: Modify channel settings

#### System Administration

- `VIEW_ADMIN_DASHBOARD`: Access admin dashboard
- `VIEW_AUDIT_LOGS`: View audit logs
- `MANAGE_SYSTEM_SETTINGS`: System-wide settings

### Usage Examples

```python
from app.core.permissions import require_permission, Permission

@router.post("/moderate")
async def moderate_content(
    current_user: User = Depends(require_permission(Permission.DELETE_MESSAGES))
):
    # Only users with DELETE_MESSAGES permission can access
    pass
```

## Admin Actions

### Supported Actions

1. **User Actions**
   - `BAN_USER`: Permanently or temporarily ban user
   - `UNBAN_USER`: Remove ban from user
   - `SUSPEND_USER`: Temporarily suspend user
   - `UNSUSPEND_USER`: Remove suspension
   - `KICK_USER`: Remove user from channel

2. **Role Actions**
   - `ASSIGN_ROLE`: Assign role to user
   - `REMOVE_ROLE`: Remove role from user

3. **Message Actions**
   - `DELETE_MESSAGE`: Delete message
   - `PIN_MESSAGE`: Pin message
   - `UNPIN_MESSAGE`: Unpin message

4. **Channel Actions**
   - `CREATE_CHANNEL`: Create new channel
   - `DELETE_CHANNEL`: Delete channel
   - `ARCHIVE_CHANNEL`: Archive channel

### Action Metadata

Each admin action includes metadata for audit purposes:

```json
{
  "duration_hours": 24, // For bans/suspensions
  "message_content": "...", // For message deletions
  "channel_id": "...", // For channel-specific actions
  "bulk_operation": true // For bulk actions
}
```

## WebSocket Integration

### Admin Events

1. **Force Disconnect**

   ```json
   {
     "type": "force_disconnect",
     "reason": "Account suspended or banned",
     "timestamp": "2024-01-01T12:00:00Z"
   }
   ```

2. **Message Deletion**

   ```json
   {
     "type": "message_deleted",
     "message_id": "msg_123",
     "deleted_by": "admin_user",
     "reason": "Inappropriate content"
   }
   ```

3. **User Status Changes**
   ```json
   {
     "type": "user_status_changed",
     "user_id": "user_123",
     "status": "BANNED",
     "reason": "Violation of terms"
   }
   ```

## Security Considerations

### Role Hierarchy Enforcement

- Users cannot target users with equal or higher roles
- Role assignments are validated against assigner's role
- Super Admins have ultimate authority

### Audit Trail

- All admin actions are logged with full context
- Immutable audit log for compliance
- Real-time action tracking

### Permission Validation

- Every admin action requires permission check
- Channel-specific permissions respected
- Fail-safe authorization (deny by default)

### WebSocket Security

- Force disconnect for banned/suspended users
- Real-time permission validation
- Secure admin event broadcasting

## Usage Guide

### Creating the First Admin

1. **Using the Utility Script**

   ```bash
   python scripts/create_admin.py create admin admin@example.com password123 SUPER_ADMIN
   ```

2. **Manual Database Creation**
   ```python
   # Create user normally, then assign role
   role = await prisma.userrole.create(
       data={
           "userId": user.id,
           "role": Role.SUPER_ADMIN,
           "channelId": None,  # Global role
           "assignedBy": user.id
       }
   )
   ```

### Testing the System

```bash
# List all users and their roles
python scripts/create_admin.py list

# Test permission system
python scripts/create_admin.py test

# Create sample admin action
python scripts/create_admin.py sample-action
```

### Common Admin Operations

1. **Ban a User**

   ```bash
   POST /api/v1/admin/users/{user_id}/ban
   {
     "user_id": "user_123",
     "reason": "Spam",
     "duration_hours": 24
   }
   ```

2. **Assign Moderator Role**

   ```bash
   POST /api/v1/admin/users/{user_id}/roles
   {
     "user_id": "user_123",
     "role": "MODERATOR",
     "channel_id": "channel_456",
     "reason": "Promoted to moderator"
   }
   ```

3. **Delete Message**
   ```bash
   DELETE /api/v1/admin/messages/{message_id}
   {
     "message_id": "msg_123",
     "reason": "Inappropriate content"
   }
   ```

## Error Handling

### Common Error Responses

1. **Insufficient Permissions**

   ```json
   {
     "detail": "Insufficient permissions. Required: BAN_USERS",
     "status_code": 403
   }
   ```

2. **Cannot Target User**

   ```json
   {
     "detail": "Cannot ban user with equal or higher role",
     "status_code": 403
   }
   ```

3. **Role Assignment Conflict**
   ```json
   {
     "detail": "User already has this role",
     "status_code": 400
   }
   ```

## Monitoring and Analytics

### Admin Dashboard Metrics

- Total users by status (active, suspended, banned)
- Channel statistics (public vs private)
- Message volume and trends
- Recent admin actions

### Audit Log Analysis

- Admin action frequency
- Most common moderation actions
- User behavior patterns
- System usage statistics

## Best Practices

### Role Assignment

1. Start with minimal permissions
2. Use channel-specific roles when possible
3. Regular role audits and cleanup
4. Document role changes with reasons

### Moderation

1. Always provide clear reasons for actions
2. Use proportional responses (warning → suspension → ban)
3. Document escalation procedures
4. Regular review of moderation decisions

### Security

1. Regular permission audits
2. Monitor admin action logs
3. Implement rate limiting for admin actions
4. Secure admin credentials and access

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user's role assignments
   - Verify permission mappings
   - Ensure role hierarchy is correct

2. **WebSocket Disconnection Issues**
   - Check connection manager state
   - Verify user authentication
   - Review force disconnect logic

3. **Database Constraint Errors**
   - Check unique constraints on roles
   - Verify foreign key relationships
   - Review schema migrations

### Debug Commands

```bash
# Check user permissions
python scripts/create_admin.py test

# List all roles and assignments
python scripts/create_admin.py list

# Verify database schema
python -m prisma db pull
```

## Future Enhancements

### Planned Features

1. **Advanced Moderation**
   - Message editing capabilities
   - Bulk message operations
   - Content filtering rules

2. **Enhanced Analytics**
   - Detailed user behavior tracking
   - Moderation effectiveness metrics
   - Predictive moderation alerts

3. **Automation**
   - Auto-moderation rules
   - Scheduled actions
   - Smart content detection

4. **Integration**
   - External moderation services
   - Webhook notifications
   - Third-party admin tools
