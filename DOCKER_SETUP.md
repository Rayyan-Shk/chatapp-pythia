# 🐳 Docker Setup Guide

## Quick Start

### For Windows Users:

```bash
start-app.bat
```

### For Linux/Mac Users:

```bash
chmod +x start-app.sh
./start-app.sh
```

### Manual Start:

```bash
docker-compose up --build
```

## 🏗️ Architecture Overview

The application consists of 4 main services:

1. **PostgreSQL Database** (port 5432)
   - Stores user data, channels, messages
   - Uses Prisma ORM for database operations

2. **Redis** (port 6330)
   - Handles real-time WebSocket connections
   - Manages session data and caching

3. **FastAPI Backend** (port 8000)
   - REST API endpoints
   - WebSocket server for real-time chat
   - Authentication and authorization

4. **Next.js Frontend** (port 3000)
   - React-based chat interface
   - Real-time message updates
   - User authentication UI

## 🔄 Startup Sequence

The Docker setup follows this exact sequence:

1. **PostgreSQL starts** → Waits for health check
2. **Redis starts** → Waits for health check
3. **Backend starts** → Waits for DB & Redis
4. **Frontend starts** → Waits for backend

### Backend Startup Process:

```
1. Wait for PostgreSQL to be ready
2. Wait for Redis to be ready
3. Generate Prisma client
4. Push database schema
5. Start FastAPI application
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

## 🛠️ Development

### View Logs:

```bash
docker-compose logs -f [service_name]
```

### Stop Services:

```bash
docker-compose down
```

### Rebuild Specific Service:

```bash
docker-compose up --build [service_name]
```

### Access Database:

```bash
docker-compose exec postgres psql -U user -d pythia_chat
```

## 🔧 Troubleshooting

### Common Issues:

1. **Port Already in Use**

   ```bash
   docker-compose down
   # Check what's using the port
   netstat -ano | findstr :3000
   ```

2. **Database Connection Issues**

   ```bash
   docker-compose logs postgres
   docker-compose logs backend
   ```

3. **Prisma Generation Issues**

   ```bash
   docker-compose exec backend prisma generate
   ```

4. **Permission Issues**
   ```bash
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

## 📁 File Structure

```
├── docker-compose.yml          # Main orchestration
├── start-app.bat              # Windows startup script
├── start-app.sh               # Linux/Mac startup script
├── backend/
│   ├── Dockerfile             # Backend container
│   ├── startup.sh             # Backend startup sequence
│   └── .env                   # Backend environment variables
└── apps/web/
    └── Dockerfile             # Frontend container
```

## 🔐 Environment Variables

Key environment variables are set in `docker-compose.yml`:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `BACKEND_CORS_ORIGINS`: Allowed frontend origins
- `JWT_SECRET_KEY`: Authentication secret

## 🚀 Production Deployment

For production, modify the environment variables and remove development-specific settings:

```bash
# Set production environment
export ENVIRONMENT=production

# Use production database and Redis
# Update CORS origins for production domain
# Set secure JWT secret
```
