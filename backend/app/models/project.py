from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    color: Optional[str] = "#06b6d4"
    icon: Optional[str] = "Bot"

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    color: str = "#06b6d4"
    icon: str = "Bot"
    createdAt: str
    keyCount: int = 0
    totalBalance: float = 0.0
