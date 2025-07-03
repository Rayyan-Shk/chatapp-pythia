# Message Editing & Deletion

## Overview

Simple message editing and deletion system built with DRY principles - extends existing architecture without code duplication.

## Features

### ✅ Message Editing

- **Edit own messages**: Users can edit their own messages
- **Real-time updates**: Edits broadcast instantly via WebSocket
- **Mention handling**: @mentions updated automatically
- **Edit tracking**: `isEdited` flag and `updatedAt` timestamp

### ✅ Message Deletion

- **Delete own messages**: Users can delete their own messages
- **Cascade deletion**: Mentions and reactions automatically removed
- **Real-time updates**: Deletions broadcast instantly

### 🔒 Security

- **Ownership validation**: Only message author can edit/delete
- **Channel membership**: Must be channel member to edit/delete
- **Permission inheritance**: Admins can delete any message (existing admin system)

## API Endpoints

### Edit Message

```http
PUT /api/v1/messages/{message_id}
Content-Type: application/json

{
  "content": "Updated message content with @username"
}
```

**Response:**

```json
{
  "id": "msg_123",
  "content": "Updated message content with @username",
  "user_id": "user_456",
  "channel_id": "channel_789",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:05:00Z",
  "is_edited": true,
  "user": {
    "id": "user_456",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Delete Message

```http
DELETE /api/v1/messages/{message_id}
```

**Response:**

```json
{
  "message": "Message deleted successfully"
}
```

## WebSocket Events

### Message Edited

```json
{
  "type": "message_edited",
  "data": {
    "id": "msg_123",
    "content": "Updated content",
    "is_edited": true,
    "updated_at": "2024-01-01T10:05:00Z",
    "user": {...}
  },
  "timestamp": "2024-01-01T10:05:00Z"
}
```

### Message Deleted

```json
{
  "type": "message_deleted",
  "message_id": "msg_123",
  "deleted_by": "john_doe",
  "channel_id": "channel_789"
}
```

## Database Changes

**Minimal schema extension:**

```sql
-- Added to existing messages table
isEdited  Boolean  @default(false)
```

**Existing fields leveraged:**

- `updatedAt` - Automatically updated on edit
- Cascade deletes handle mentions/reactions

## DRY Implementation

### ✅ Code Reuse

- **Validation**: Reused `extract_mentions()` function
- **Permissions**: Reused channel membership checks
- **WebSocket**: Reused broadcast patterns
- **Models**: Extended existing `MessageUpdate` model
- **Database**: Leveraged existing `updatedAt` field

### ✅ No Duplication

- **Auth logic**: Reused existing authentication
- **Channel access**: Reused existing member validation
- **Mention processing**: Reused existing mention extraction
- **Response patterns**: Reused existing response models

## Usage Examples

### Frontend Integration

```typescript
// Edit message
const editMessage = async (messageId: string, content: string) => {
  const response = await fetch(`/api/v1/messages/${messageId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  return response.json();
};

// Delete message
const deleteMessage = async (messageId: string) => {
  await fetch(`/api/v1/messages/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// WebSocket handling
websocket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "message_edited") {
    updateMessageInUI(data.data);
  } else if (data.type === "message_deleted") {
    removeMessageFromUI(data.message_id);
  }
};
```

### Testing

```bash
# Edit message
curl -X PUT http://localhost:8000/api/v1/messages/msg_123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated content with @alice"}'

# Delete message
curl -X DELETE http://localhost:8000/api/v1/messages/msg_123 \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling

### Common Errors

```json
// Not message owner
{
  "detail": "Can only edit your own messages",
  "status_code": 403
}

// Not channel member
{
  "detail": "Must be a member of the channel to edit messages",
  "status_code": 403
}

// Message not found
{
  "detail": "Message not found",
  "status_code": 404
}
```

## Integration with Admin System

Admins can delete any message via existing admin endpoints:

```http
DELETE /api/v1/admin/messages/{message_id}
```

This leverages the existing admin permission system without duplicating deletion logic.

## Performance Notes

- **Minimal overhead**: Single database update for edits
- **Efficient mentions**: Batch delete/create for mention updates
- **WebSocket efficiency**: Reuses existing broadcast infrastructure
- **Database optimization**: Leverages existing indexes

## Future Enhancements

### Potential Features

- **Edit history**: Track edit history with timestamps
- **Edit time limits**: Restrict editing after certain time
- **Edit notifications**: Show "edited" indicator in UI
- **Bulk operations**: Admin bulk delete/edit capabilities

### Implementation Notes

All future features should follow the same DRY principles:

- Extend existing models rather than creating new ones
- Reuse existing validation and permission logic
- Leverage existing WebSocket infrastructure
- Minimize database schema changes
