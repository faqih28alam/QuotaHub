from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "QuotaHub API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB Connection
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "quotahub"
    
    # Required secrets. Set them in backend/.env. Never commit real values.
    APP_MASTER_ENCRYPTION_KEY: str = ""
    JWT_SECRET: str = ""
    DEFAULT_USERNAME: str = ""
    DEFAULT_PASSWORD: str = ""

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

_REQUIRED_SECRETS = (
    "APP_MASTER_ENCRYPTION_KEY",
    "JWT_SECRET",
    "DEFAULT_USERNAME",
    "DEFAULT_PASSWORD",
)
_missing = [name for name in _REQUIRED_SECRETS if not str(getattr(settings, name)).strip()]
if _missing:
    raise RuntimeError(
        "Missing required environment variables: "
        + ", ".join(_missing)
        + ". Copy backend/.env.example to backend/.env and fill in your own values."
    )
