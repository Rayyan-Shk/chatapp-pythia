# Pythia Conversations Backend

FastAPI-based backend for the Pythia Conversations chat application.

## Architecture

- **FastAPI**: Modern, fast web framework for building APIs
- **Prisma**: Type-safe database ORM for Python
- **PostgreSQL**: Primary database
- **Redis**: Caching and pub/sub for real-time features
- **JWT**: Authentication and authorization
- **Celery**: Background task processing

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API endpoints
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── users.py        # User management
│   │   ├── channels.py     # Channel management
│   │   └── messages.py     # Message handling
│   ├── core/               # Core functionality
│   │   ├── config.py       # Configuration settings
│   │   ├── database.py     # Database connection
│   │   ├── redis.py        # Redis connection
│   │   └── auth.py         # Authentication utilities
│   ├── models/             # Pydantic models
│   │   ├── user.py         # User models
│   │   ├── channel.py      # Channel models
│   │   └── message.py      # Message models
│   ├── services/           # Business logic services
│   ├── workers/            # Celery workers
│   └── main.py             # FastAPI application
├── prisma/
│   └── schema.prisma       # Database schema
├── requirements.txt        # Python dependencies
├── start.py               # Application startup script
└── Dockerfile             # Docker configuration
```

## Features

### Authentication & Authorization

- JWT-based authentication
- User registration and login
- Protected endpoints with user context

### User Management

- User profiles with avatars
- User search functionality
- Profile updates

### Channel Management

- Public and private channels
- Channel membership management
- Join/leave functionality

### Message System

- Real-time messaging
- @mentions with notification
- Message reactions (emoji)
- Message history with pagination

### Real-time Features

- WebSocket support for live updates
- Typing indicators
- User presence tracking

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Users

- `GET /api/v1/users/` - List all users
- `GET /api/v1/users/{user_id}` - Get user by ID
- `PUT /api/v1/users/{user_id}` - Update user profile
- `GET /api/v1/users/search/{query}` - Search users

### Channels

- `GET /api/v1/channels/` - List public channels
- `GET /api/v1/channels/my` - Get user's channels
- `POST /api/v1/channels/` - Create channel
- `GET /api/v1/channels/{channel_id}` - Get channel details
- `POST /api/v1/channels/join` - Join channel
- `DELETE /api/v1/channels/{channel_id}/leave` - Leave channel

### Messages

- `GET /api/v1/messages/channel/{channel_id}` - Get channel messages
- `POST /api/v1/messages/` - Send message
- `GET /api/v1/messages/{message_id}` - Get message details
- `POST /api/v1/messages/reactions` - Add/remove reaction
- `GET /api/v1/messages/mentions/my` - Get user mentions

## Setup & Development

### Prerequisites

- Python 3.11+
- PostgreSQL
- Redis

### Installation

1. **Create virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create `.env` file in the backend directory:

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/pythia_chat
   REDIS_URL=redis://localhost:6330
   JWT_SECRET_KEY=your-super-secret-jwt-key
   ENVIRONMENT=development
   ```

4. **Set up database:**
   - Install PostgreSQL and Redis locally
   - Create database: `pythia_chat`
   - Update connection strings in `.env` if needed

5. **Generate Prisma client:**

   ```bash
   prisma generate
   ```

6. **Run database migrations:**

   ```bash
   prisma db push
   ```

7. **Set up default channels:**

   ```bash
   python scripts/setup_default_channels.py
   ```

8. **Start the development server:**
   ```bash
   python start.py
   ```

The API will be available at `http://localhost:8000`

### API Documentation

FastAPI automatically generates interactive API documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Schema

The application uses the following main entities:

- **Users**: User accounts with authentication
- **Channels**: Chat channels (public/private)
- **Messages**: Chat messages with content and metadata
- **ChannelMembers**: Many-to-many relationship for channel membership
- **Mentions**: @mentions in messages
- **MessageReactions**: Emoji reactions to messages

## Configuration

Key configuration options in `config.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `BACKEND_CORS_ORIGINS`: Allowed CORS origins
- `ENVIRONMENT`: development/production

## Docker Support

Build and run with Docker:

```bash
# Build image
docker build -t pythia-backend .

# Run container
docker run -p 8000:8000 pythia-backend
```

Or use Docker Compose from the project root:

```bash
docker-compose up backend
```

## Testing

Run tests with pytest:

```bash
pytest
```

## Production Deployment

1. Set `ENVIRONMENT=production` in config
2. Use a strong `JWT_SECRET_KEY`
3. Configure proper database credentials
4. Set up SSL/TLS termination
5. Use a production ASGI server like Gunicorn with Uvicorn workers

## Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Write tests for new features
4. Update documentation as needed
