"""Auth routes — register, login, profile management."""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from datetime import datetime
from src.core.security import authenticate_user, create_access_token, get_password_hash, get_current_user
from src.schemas.user import UserCreate, UserLogin, UserUpdate, Token
from src.database.mongodb.connection import get_database
from src.core.constants import COLLECTION_USERS
from src.core.limiter import limiter

router = APIRouter()


def _users():
    return get_database()[COLLECTION_USERS]


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, user: UserCreate):
    if await _users().find_one({"email": user.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    user_dict = user.model_dump()
    user_dict.pop("password")
    user_dict.pop("confirm_password")
    user_dict["hashed_password"] = await get_password_hash(user.password)
    user_dict["created_at"] = datetime.utcnow()

    await _users().insert_one(user_dict)
    return {"message": "Account created successfully"}


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, user: UserLogin):
    authenticated_user = await authenticate_user(user.email, user.password)
    token = create_access_token(data={"sub": authenticated_user["email"]})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    created_at = current_user.get("created_at")
    return {
        "email": current_user.get("email"),
        "username": current_user.get("username"),
        "first_name": current_user.get("first_name"),
        "last_name": current_user.get("last_name"),
        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else None,
    }


@router.put("/me")
async def update_me(user_update: UserUpdate, current_user=Depends(get_current_user)):
    update_data = {k: v for k, v in user_update.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        return {"message": "Nothing to update"}
    update_data["updated_at"] = datetime.utcnow()
    result = await _users().update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Profile updated successfully"}
