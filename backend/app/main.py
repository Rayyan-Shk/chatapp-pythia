from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import connect_db, disconnect_db
from .core.redis import close_redis_client
from .api.auth import router as auth_router
from .api.users import router as users_router
from .api.channels import router as channels_router
from .api.messages import router as messages_router
from .api.admin import router as admin_router
from .websocket.events import websocket_endpoint
from .websocket.connection_manager import connection_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    await connection_manager.start_redis_listener()
    yield
    # Shutdown
    await connection_manager.stop_redis_listener()
    await disconnect_db()
    await close_redis_client()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(channels_router, prefix=f"{settings.API_V1_STR}/channels", tags=["channels"])
app.include_router(messages_router, prefix=f"{settings.API_V1_STR}/messages", tags=["messages"])
app.include_router(admin_router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])


@app.get("/")
async def root():
    return {"message": "Pythia Conversations API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws")
async def websocket_route(websocket: WebSocket, token: str = Query(...)):
    """WebSocket endpoint for real-time communication"""
    await websocket_endpoint(websocket, token) 