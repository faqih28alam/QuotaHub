import base64

from pydantic_settings import BaseSettings, SettingsConfigDict

_PLACEHOLDER_SECRETS = {
    "changeme",
    "change-me",
    "change_me",
    "secret",
    "password",
    "admin",
    "admin123",
    "jwt_secret",
    "jwt-secret",
    "replace-me",
    "replace-with-long-random-string",
    "replace-with-your-password",
    "your-secret",
    "your_secret",
    "default",
    "default-password",
    "string_acak_panjang",
    "hasil_generate",
}


class Settings(BaseSettings):
    PROJECT_NAME: str = "QuotaHub API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # development keeps /docs available. production disables /docs, /redoc, and openapi.
    ENVIRONMENT: str = "development"

    # MongoDB Connection
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "quotahub"

    # Required secrets. Set them in backend/.env. Never commit real values.
    APP_MASTER_ENCRYPTION_KEY: str = ""
    JWT_SECRET: str = ""
    DEFAULT_USERNAME: str = ""
    DEFAULT_PASSWORD: str = ""

    # Public registration. Turn this off on any server that stores real API keys.
    ALLOW_SIGNUP: bool = True

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Comma-separated browser origins. No trailing slash. JSON arrays are also accepted.
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    def cors_origin_list(self) -> list[str]:
        raw = self.CORS_ORIGINS.strip()
        if not raw:
            return []
        if raw.startswith("["):
            import json

            parsed = json.loads(raw)
            if not isinstance(parsed, list):
                raise RuntimeError("CORS_ORIGINS JSON value must be an array of origins.")
            return [str(item).strip() for item in parsed if str(item).strip()]
        return [part.strip() for part in raw.split(",") if part.strip()]


settings = Settings()


def _reject_placeholder(name: str, value: str) -> None:
    cleaned = value.strip()
    if not cleaned or cleaned.lower() in _PLACEHOLDER_SECRETS:
        raise RuntimeError(
            f"{name} is missing or still a placeholder. "
            "Set a unique value in backend/.env before starting."
        )


def _require_master_key(value: str) -> None:
    _reject_placeholder("APP_MASTER_ENCRYPTION_KEY", value)
    try:
        raw = base64.b64decode(value.strip(), validate=True)
    except Exception:
        raise RuntimeError(
            "APP_MASTER_ENCRYPTION_KEY must be a base64-encoded 32-byte key. "
            'Generate one with: python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"'
        ) from None
    if len(raw) != 32:
        raise RuntimeError(
            f"APP_MASTER_ENCRYPTION_KEY must decode to exactly 32 bytes. Got {len(raw)} bytes."
        )


_reject_placeholder("JWT_SECRET", settings.JWT_SECRET)
_reject_placeholder("DEFAULT_PASSWORD", settings.DEFAULT_PASSWORD)
if not settings.DEFAULT_USERNAME.strip():
    raise RuntimeError(
        "DEFAULT_USERNAME is missing. Copy backend/.env.example to backend/.env and fill in your own values."
    )
_require_master_key(settings.APP_MASTER_ENCRYPTION_KEY)

_cors_origins = settings.cors_origin_list()
if "*" in _cors_origins:
    raise RuntimeError(
        "CORS_ORIGINS cannot contain *. List each frontend origin explicitly."
    )
if settings.ENVIRONMENT.strip().lower() == "production":
    if not _cors_origins:
        raise RuntimeError(
            "CORS_ORIGINS must list the Vercel production origin and any custom domain when ENVIRONMENT=production."
        )
    _local = ("http://localhost", "http://127.0.0.1", "https://localhost", "https://127.0.0.1")
    if all(origin.startswith(_local) for origin in _cors_origins):
        raise RuntimeError(
            "CORS_ORIGINS in production still points at localhost. Add the Vercel origin and any custom domain."
        )
