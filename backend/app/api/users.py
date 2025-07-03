from fastapi import APIRouter, HTTPException, Depends, status
from typing import List

from ..core.database import prisma
from ..models.user import User, UserUpdate
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    """Get all users"""
    users = await prisma.user.find_many(
        order_by={"username": "asc"}
    )
    return [User.model_validate(user) for user in users]


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Get user by ID"""
    user = await prisma.user.find_unique(where={"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User.model_validate(user)


@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update user (only own profile)"""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own profile"
        )
    
    # Check if username/email already exists (if being updated)
    update_data = user_data.model_dump(exclude_unset=True)
    
    if "username" in update_data or "email" in update_data:
        where_conditions = []
        if "username" in update_data:
            where_conditions.append({"username": update_data["username"]})
        if "email" in update_data:
            where_conditions.append({"email": update_data["email"]})
        
        existing_user = await prisma.user.find_first(
            where={
                "AND": [
                    {"id": {"not": user_id}},
                    {"OR": where_conditions}
                ]
            }
        )
        
        if existing_user:
            if existing_user.username == update_data.get("username"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
    
    user = await prisma.user.update(
        where={"id": user_id},
        data=update_data
    )
    
    return User.model_validate(user)


@router.get("/search/{query}", response_model=List[User])
async def search_users(query: str, current_user: User = Depends(get_current_user)):
    """Search users by username or email"""
    users = await prisma.user.find_many(
        where={
            "OR": [
                {"username": {"contains": query, "mode": "insensitive"}},
                {"email": {"contains": query, "mode": "insensitive"}}
            ]
        },
        take=10,
        order_by={"username": "asc"}
    )
    
    return [User.model_validate(user) for user in users] 