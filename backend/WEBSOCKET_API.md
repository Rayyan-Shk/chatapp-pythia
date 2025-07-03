# WebSocket API Documentation - Pythia Conversations

## Overview

The Pythia Conversations WebSocket API provides real-time communication capabilities for the chat application. It handles message broadcasting, typing indicators, user presence, and channel management.

## Connection

### Endpoint

```
ws://localhost:8000/ws?token={JWT_TOKEN}
```

### Authentication

WebSocket connections require JWT authentication via query parameter:

- **Parameter**: `token`
- **Type**: JWT access token obtained from `/api/v1/auth/login`
- **Required**: Yes

### Connection Flow

1. Client connects with valid JWT token
2. Server authenticates user
3. User automatically joins their channels
4. Connection established message sent
5. Real-time message handling begins

## Message Types

### Client to Server Messages

#### 1. Join Channel

Join a specific channel room for real-time updates.

```json
{
  "type": "join_channel",
  "channel_id": "channel-uuid"
}
```

**Response:**

```json
{
  "type": "channel_joined",
  "channel_id": "channel-uuid",
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 2. Leave Channel

Leave a channel room to stop receiving updates.

```json
{
  "type": "leave_channel",
  "channel_id": "channel-uuid"
}
```

**Response:**

```json
{
  "type": "channel_left",
  "channel_id": "channel-uuid",
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 3. Typing Indicator

Send typing status to other channel members.

```json
{
  "type": "typing_indicator",
  "channel_id": "channel-uuid",
  "is_typing": true
}
```

#### 4. Ping

Health check message to test connection.

```json
{
  "type": "ping"
}
```

**Response:**

```json
{
  "type": "pong",
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 5. Get Online Users

Request list of online users in a channel.

```json
{
  "type": "get_online_users",
  "channel_id": "channel-uuid"
}
```

**Response:**

```json
{
  "type": "online_users",
  "channel_id": "channel-uuid",
  "users": ["user1-id", "user2-id"],
  "timestamp": "2024-01-07T10:30:00Z"
}
```

### Server to Client Messages

#### 1. Connection Established

Sent when WebSocket connection is successfully established.

```json
{
  "type": "connection_established",
  "user_id": "user-uuid",
  "username": "john_doe",
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 2. New Message

Broadcast when a new message is posted to a channel.

```json
{
  "type": "new_message",
  "data": {
    "id": "message-uuid",
    "content": "Hello everyone!",
    "channelId": "channel-uuid",
    "userId": "user-uuid",
    "createdAt": "2024-01-07T10:30:00Z",
    "updatedAt": "2024-01-07T10:30:00Z",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "email": "john@example.com"
    }
  },
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 3. Message Reaction

Broadcast when a reaction is added/removed from a message.

```json
{
  "type": "message_reaction",
  "message_id": "message-uuid",
  "data": {
    "emoji": "👍",
    "user_id": "user-uuid",
    "username": "john_doe",
    "action": "add"
  },
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 4. Typing Indicator

Broadcast when someone starts/stops typing.

```json
{
  "type": "typing_indicator",
  "user_id": "user-uuid",
  "channel_id": "channel-uuid",
  "is_typing": true,
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 5. User Status

Broadcast when a user comes online/offline.

```json
{
  "type": "user_status",
  "user_id": "user-uuid",
  "status": "online",
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 6. User Joined Channel

Broadcast when a user joins a channel.

```json
{
  "type": "user_joined",
  "user_id": "user-uuid",
  "channel_id": "channel-uuid",
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 7. User Left Channel

Broadcast when a user leaves a channel.

```json
{
  "type": "user_left",
  "user_id": "user-uuid",
  "channel_id": "channel-uuid",
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 8. Mention Notification

Sent to a user when they are mentioned in a message.

```json
{
  "type": "mention_notification",
  "data": {
    "message_id": "message-uuid",
    "channel_id": "channel-uuid",
    "content": "Hey @john_doe, check this out!",
    "from_user_id": "sender-uuid",
    "from_username": "jane_doe"
  },
  "timestamp": "2024-01-07T10:30:00Z"
}
```

#### 9. Error Message

Sent when an error occurs processing a client message.

```json
{
  "type": "error",
  "error_code": "access_denied",
  "message": "Access denied to channel",
  "details": "User is not a member of this private channel"
}
```

## Error Codes

| Code                     | Description                                |
| ------------------------ | ------------------------------------------ |
| `invalid_json`           | Malformed JSON in client message           |
| `unknown_message_type`   | Unrecognized message type                  |
| `access_denied`          | User lacks permission for requested action |
| `missing_channel_id`     | Required channel_id parameter missing      |
| `join_channel_error`     | Error joining channel                      |
| `leave_channel_error`    | Error leaving channel                      |
| `typing_indicator_error` | Error processing typing indicator          |
| `get_online_users_error` | Error retrieving online users              |
| `internal_error`         | Server-side error                          |

## Connection Management

### Auto-Join Channels

When a user connects, they automatically join WebSocket rooms for all channels they're members of.

### Presence Tracking

The server tracks user presence and broadcasts online/offline status to relevant channels.

### Connection Cleanup

When a user disconnects:

- Removed from all channel rooms
- Removed from typing indicators
- Offline status broadcast to channels
- Connection resources cleaned up

### Reconnection

Clients should implement reconnection logic with exponential backoff for network interruptions.

## Usage Examples

### JavaScript Client Example

```javascript
const token = "your-jwt-token";
const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);

ws.onopen = () => {
  console.log("Connected to WebSocket");

  // Join a channel
  ws.send(
    JSON.stringify({
      type: "join_channel",
      channel_id: "channel-uuid",
    })
  );
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "new_message":
      displayNewMessage(data.data);
      break;
    case "typing_indicator":
      showTypingIndicator(data.user_id, data.is_typing);
      break;
    case "user_status":
      updateUserStatus(data.user_id, data.status);
      break;
  }
};

ws.onclose = () => {
  console.log("WebSocket connection closed");
  // Implement reconnection logic
};
```

### Python Client Example

```python
import asyncio
import websockets
import json

async def connect_to_chat():
    token = "your-jwt-token"
    uri = f"ws://localhost:8000/ws?token={token}"

    async with websockets.connect(uri) as websocket:
        # Join channel
        await websocket.send(json.dumps({
            "type": "join_channel",
            "channel_id": "channel-uuid"
        }))

        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

asyncio.run(connect_to_chat())
```

## Testing

Use the provided test client:

```bash
# Install websockets dependency
pip install websockets

# Run test client (requires JWT token)
python test_websocket.py YOUR_JWT_TOKEN
```

## Security Considerations

1. **Authentication**: All connections require valid JWT tokens
2. **Authorization**: Users can only join channels they have access to
3. **Rate Limiting**: Consider implementing rate limiting for message frequency
4. **Input Validation**: All client messages are validated before processing
5. **Error Handling**: Errors are logged but sensitive information is not exposed

## Performance Notes

1. **Connection Limits**: Monitor concurrent WebSocket connections
2. **Memory Usage**: Connection manager stores active connections in memory
3. **Broadcasting**: Large channels may impact broadcast performance
4. **Cleanup**: Automatic cleanup prevents memory leaks from disconnected clients

## Integration with REST API

WebSocket events are automatically triggered by REST API actions:

- New messages via `POST /api/v1/messages/` trigger broadcasts
- Reactions via `POST /api/v1/messages/reactions` trigger reaction broadcasts
- Channel joins/leaves via channel API trigger presence updates
