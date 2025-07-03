from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from ..core.database import get_db, prisma
from ..core.auth import verify_password, get_password_hash, create_access_token, verify_token
from ..models.user import UserCreate, UserLogin, AuthResponse, User


async def _setup_default_channels_for_first_user(user_id: str):
    """Set up default channels for the first user"""
    try:
        # Default channels to create
        default_channels = [
            {
                "name": "general",
                "description": "General discussion for everyone"
            },
            {
                "name": "random",
                "description": "Random conversations and fun stuff"
            },
            {
                "name": "announcements",
                "description": "Important announcements and updates"
            }
        ]
        
        for channel_data in default_channels:
            # Check if channel already exists
            existing = await prisma.channel.find_first(
                where={"name": channel_data["name"]}
            )
            
            if existing:
                # Channel exists, just add user to it
                await prisma.channelmember.create(
                    data={
                        "userId": user_id,
                        "channelId": existing.id
                    }
                )
                continue
                
            # Create the channel and add user
            channel = await prisma.channel.create(data=channel_data)
            await prisma.channelmember.create(
                data={
                    "userId": user_id,
                    "channelId": channel.id
                }
            )
            
    except Exception as e:
        print(f"Error setting up default channels: {e}")
        # Don't fail registration if channel setup fails

router = APIRouter()
security = HTTPBearer()


def prisma_user_to_pydantic(prisma_user) -> User:
    """Convert Prisma user object to Pydantic User model"""
    user_dict = {
        "id": prisma_user.id,
        "email": prisma_user.email,
        "username": prisma_user.username,
        "avatar": prisma_user.avatar,
        "status": prisma_user.status,
        "banned_until": prisma_user.bannedUntil,
        "created_at": prisma_user.createdAt,
        "updated_at": prisma_user.updatedAt
    }
    return User.model_validate(user_dict)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await prisma.user.find_unique(where={"id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return prisma_user_to_pydantic(user)


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await prisma.user.find_first(
        where={
            "OR": [
                {"email": user_data.email},
                {"username": user_data.username}
            ]
        }
    )
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    
    user = await prisma.user.create(
        data={
            "email": user_data.email,
            "username": user_data.username,
            "password": hashed_password,
            "avatar": user_data.avatar
        }
    )
    
    # Check if this is the first user and create default channels
    total_users = await prisma.user.count()
    if total_users == 1:
        # This is the first user, create default channels and assign them
        await _setup_default_channels_for_first_user(user.id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return AuthResponse(
        access_token=access_token,
        user=prisma_user_to_pydantic(user)
    )


@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    """Login user"""
    user = await prisma.user.find_unique(where={"username": user_data.username})
    
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return AuthResponse(
        access_token=access_token,
        user=prisma_user_to_pydantic(user)
    )


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user 