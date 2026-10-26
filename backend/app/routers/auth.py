from fastapi import APIRouter, HTTPException, Request, status, Depends
from app.models.user import LoginRequest, RegisterRequest, AuthResponse, UserResponse
from app.core.config import settings
from app.core.database import get_database
from app.core.rate_limit import enforce_login_rate_limit
from app.core.security import create_access_token
from passlib.context import CryptContext
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _auth_response(user_id: str, username: str, display_name: str, role: str) -> AuthResponse:
    token = create_access_token(user_id=user_id, username=username, role=role)
    return AuthResponse(
        accessToken=token,
        username=username,
        displayName=display_name,
        role=role,
        isGuest=False,
    )


async def _ensure_default_user(db):
    existing = await db["users"].find_one({"username": settings.DEFAULT_USERNAME})
    if existing:
        return existing
    doc = {
        "username": settings.DEFAULT_USERNAME,
        "email": None,
        "hashed_password": pwd_context.hash(settings.DEFAULT_PASSWORD),
        "role": "admin",
        "is_guest": False,
        "created_at": datetime.utcnow(),
    }
    result = await db["users"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


@router.get("/config")
async def auth_config():
    return {"allowSignup": settings.ALLOW_SIGNUP}


@router.post("/login", response_model=AuthResponse)
async def login(creds: LoginRequest, request: Request, db=Depends(get_database)):
    clean_user = creds.username.strip().lower()
    enforce_login_rate_limit(request, clean_user)

    if clean_user == settings.DEFAULT_USERNAME and creds.password == settings.DEFAULT_PASSWORD:
        user_doc = await _ensure_default_user(db)
        return _auth_response(
            user_id=str(user_doc["_id"]),
            username=settings.DEFAULT_USERNAME,
            display_name="Support Team",
            role="admin",
        )

    user_doc = await db["users"].find_one({"username": clean_user})
    if user_doc and pwd_context.verify(creds.password, user_doc.get("hashed_password", "")):
        return _auth_response(
            user_id=str(user_doc["_id"]),
            username=user_doc["username"],
            display_name=user_doc["username"],
            role=user_doc.get("role", "user"),
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password",
    )


@router.post("/register", response_model=AuthResponse)
async def register(creds: RegisterRequest, request: Request, db=Depends(get_database)):
    clean_user = creds.username.strip().lower()
    enforce_login_rate_limit(request, clean_user)
    if not settings.ALLOW_SIGNUP:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sign up is disabled")
    if len(clean_user) < 3 or len(creds.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters and password at least 6",
        )

    existing = await db["users"].find_one({"username": clean_user})
    if existing or clean_user == settings.DEFAULT_USERNAME:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    hashed = pwd_context.hash(creds.password)
    doc = {
        "username": clean_user,
        "email": creds.email,
        "hashed_password": hashed,
        "role": "user",
        "is_guest": False,
        "created_at": datetime.utcnow(),
    }
    result = await db["users"].insert_one(doc)
    return _auth_response(
        user_id=str(result.inserted_id),
        username=clean_user,
        display_name=clean_user,
        role="user",
    )


@router.post("/guest", response_model=UserResponse)
async def guest_login():
    return UserResponse(
        username="guest",
        displayName="Guest User",
        role="guest",
        isGuest=True,
    )
