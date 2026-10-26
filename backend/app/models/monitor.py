from pydantic import BaseModel, Field
from typing import Literal, Optional


class MonitorCreate(BaseModel):
    project_id: str
    name: str = Field(min_length=1, max_length=80)
    url: str
    route: Literal["public", "tailscale"] = "public"
    expected_status: int = 200
    timeout_seconds: float = 5


class MonitorResponse(BaseModel):
    id: str
    projectId: str
    name: str
    url: str
    route: Literal["public", "tailscale"]
    expectedStatus: int
    timeoutSeconds: float
    status: Literal["up", "down", "unknown"]
    statusCode: Optional[int] = None
    latencyMs: Optional[int] = None
    error: Optional[str] = None
    lastChecked: Optional[str] = None
