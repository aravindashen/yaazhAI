import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.database.db import get_db
from backend.database.models import User
from backend.security import hash_password, verify_password, create_access_token, get_current_user_optional

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class UserRegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: Optional[str] = "இளங்கோவன்"
    preferred_role: Optional[str] = "study"

class UserLoginRequest(BaseModel):
    username_or_email: str
    password: str

@router.post("/register")
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if username or email already exists
    existing = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered."
        )
        
    user_id = f"user-{uuid.uuid4().hex[:12]}"
    new_user = User(
        id=user_id,
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        display_name=req.display_name or "இளங்கோவன்",
        preferred_role=req.preferred_role or "study"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token({"sub": new_user.id, "username": new_user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "displayName": new_user.display_name,
            "preferredRole": new_user.preferred_role
        }
    }

@router.post("/login")
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == req.username_or_email) | (User.email == req.username_or_email)
    ).first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )
        
    token = create_access_token({"sub": user.id, "username": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "displayName": user.display_name,
            "preferredRole": user.preferred_role
        }
    }

@router.get("/me")
def get_current_user_profile(
    current_user_payload: Optional[dict] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    if not current_user_payload:
        return {"authenticated": False, "user": None}
        
    user_id = current_user_payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"authenticated": False, "user": None}
        
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "displayName": user.display_name,
            "preferredRole": user.preferred_role,
            "preferredLanguage": user.preferred_language
        }
    }
