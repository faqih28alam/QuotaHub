import time

from fastapi import HTTPException, Request, status

_WINDOW_SECONDS = 60
_MAX_ATTEMPTS = 10
_MAX_KEYS = 10000
_hits: dict[str, list[float]] = {}


def _client_host(request: Request) -> str:
    if request.client is None:
        return "unknown"
    return request.client.host or "unknown"


def enforce_login_rate_limit(request: Request, username: str) -> None:
    """Limit login and sign-up attempts per client IP and per username."""
    keys = (
        f"ip:{_client_host(request)}",
        f"user:{username.strip().lower()}",
    )
    now = time.monotonic()
    for key in keys:
        if key not in _hits and len(_hits) >= _MAX_KEYS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Try again in a minute.",
                headers={"Retry-After": str(_WINDOW_SECONDS)},
            )
        recent = [stamp for stamp in _hits.get(key, []) if now - stamp < _WINDOW_SECONDS]
        if len(recent) >= _MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Try again in a minute.",
                headers={"Retry-After": str(_WINDOW_SECONDS)},
            )
        recent.append(now)
        _hits[key] = recent
