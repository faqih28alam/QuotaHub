from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ApiKeyCreate(BaseModel):
    project_id: str
    provider: str  # 'tikhub' | 'openai' | 'twocaptcha' | 'anthropic' | 'gemini' | 'groq' | 'deepseek' | 'custom'
    label: str
    raw_api_key: str
    alert_threshold: float = 2.0
    max_quota: float = 20.0
    notes: Optional[str] = ""
    endpoint: Optional[str] = None
    currency: Optional[str] = "$"

class BalanceTestRequest(BaseModel):
    provider: str
    raw_api_key: str
    endpoint: Optional[str] = None
    alert_threshold: float = 2.0
    max_quota: float = 20.0

class BalanceTestResponse(BaseModel):
    success: bool = True
    balance: float
    maxQuota: float
    status: str
    lastChecked: str

class ApiKeyResponse(BaseModel):
    id: str
    projectId: str
    providerId: str
    label: str
    maskedKey: str
    balance: float
    maxQuota: float
    used: float
    currency: str = "$"
    status: str  # 'healthy' | 'warning' | 'danger'
    alertThreshold: float
    lastChecked: str
    notes: Optional[str] = ""
    endpoint: Optional[str] = None
