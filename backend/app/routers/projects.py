from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.project import ProjectCreate, ProjectResponse
from datetime import datetime
from bson import ObjectId
from typing import List

router = APIRouter(prefix="/projects", tags=["Projects"])


def _require_object_id(value: str, label: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label} ID format")
    return ObjectId(value)


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(db=Depends(get_database), user=Depends(get_current_user)):
    projects = []
    cursor = db["projects"].find({"user_id": user["id"]}).sort("created_at", -1)
    async for doc in cursor:
        p_id = str(doc["_id"])
        key_count = await db["api_keys"].count_documents({"project_id": p_id, "user_id": user["id"]})

        pipeline = [
            {"$match": {"project_id": p_id, "user_id": user["id"]}},
            {"$group": {"_id": None, "total": {"$sum": "$balance"}}},
        ]
        agg = await db["api_keys"].aggregate(pipeline).to_list(1)
        total_balance = agg[0]["total"] if agg else 0.0

        created = doc.get("created_at") or datetime.utcnow()
        projects.append(ProjectResponse(
            id=p_id,
            name=doc["name"],
            description=doc.get("description", ""),
            color=doc.get("color", "#06b6d4"),
            icon=doc.get("icon", "Bot"),
            createdAt=created.isoformat(),
            keyCount=key_count,
            totalBalance=round(total_balance, 2),
        ))
    return projects


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(data: ProjectCreate, db=Depends(get_database), user=Depends(get_current_user)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Project name is required")

    now = datetime.utcnow()
    doc = {
        "user_id": user["id"],
        "name": name,
        "description": data.description or "",
        "color": data.color,
        "icon": data.icon,
        "created_at": now,
    }
    res = await db["projects"].insert_one(doc)
    return ProjectResponse(
        id=str(res.inserted_id),
        name=name,
        description=data.description or "",
        color=data.color or "#06b6d4",
        icon=data.icon or "Bot",
        createdAt=now.isoformat(),
        keyCount=0,
        totalBalance=0.0,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, db=Depends(get_database), user=Depends(get_current_user)):
    oid = _require_object_id(project_id, "project")
    deleted = await db["projects"].delete_one({"_id": oid, "user_id": user["id"]})
    if deleted.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db["api_keys"].delete_many({"project_id": project_id, "user_id": user["id"]})
