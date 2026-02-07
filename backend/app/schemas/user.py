"""User Pydantic schemas"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str
    role: UserRole


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema"""
    user_id: Optional[str] = None
    email: Optional[str] = None

