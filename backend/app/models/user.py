from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    username: str
    hashed_password: str
    role: str = "user"  # 'admin' | 'user' | 'guest'
    is_guest: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: Optional[str] = None
    password: str

class UserResponse(BaseModel):
    username: str
    displayName: str
    role: str
    isGuest: bool

class AuthResponse(UserResponse):
    accessToken: str
