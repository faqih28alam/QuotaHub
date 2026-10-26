from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_database
from app.core.security import get_current_user
from app.models.monitor import MonitorCreate, MonitorResponse
from app.services.monitor_checker import ensure_target_allowed
from app.services.monitor_policy import TargetRejected
from app.services.monitor_runner import check_saved_monitor

router = APIRouter(prefix="/monitors", tags=["Monitors"])


def _require_object_id(value: str, label: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label} ID format")
    return ObjectId(value)


def _to_response(doc) -> MonitorResponse:
    checked = doc.get("last_checked")
    return MonitorResponse(
        id=str(doc["_id"]),
        projectId=doc["project_id"],
        name=doc["name"],
        url=doc["url"],
        route=doc.get("route", "public"),
        expectedStatus=int(doc.get("expected_status") or 200),
        timeoutSeconds=float(doc.get("timeout_seconds") or 5),
        status=doc.get("status") or "unknown",
        statusCode=doc.get("status_code"),
        latencyMs=doc.get("latency_ms"),
        error=doc.get("error"),
        lastChecked=checked.isoformat() if checked else None,
    )


@router.get("/", response_model=list[MonitorResponse])
async def list_monitors(project_id: str, db=Depends(get_database), user=Depends(get_current_user)):
    _require_object_id(project_id, "project")
    cursor = db["monitors"].find({"user_id": user["id"], "project_id": project_id}).sort("created_at", -1)
    return [_to_response(doc) async for doc in cursor]


@router.post("/", response_model=MonitorResponse, status_code=status.HTTP_201_CREATED)
async def create_monitor(data: MonitorCreate, db=Depends(get_database), user=Depends(get_current_user)):
    if not 100 <= data.expected_status <= 599:
        raise HTTPException(status_code=400, detail="invalid_url")
    if not 1 <= data.timeout_seconds <= 15:
        raise HTTPException(status_code=400, detail="invalid_url")

    project_oid = _require_object_id(data.project_id, "project")
    project = await db["projects"].find_one({"_id": project_oid, "user_id": user["id"]})
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="invalid_url")

    try:
        url = await ensure_target_allowed(data.url, data.route)
    except TargetRejected as exc:
        raise HTTPException(status_code=400, detail=exc.code) from None

    now = datetime.utcnow()
    doc = {
        "user_id": user["id"],
        "project_id": data.project_id,
        "name": name,
        "url": url,
        "route": data.route,
        "expected_status": data.expected_status,
        "timeout_seconds": data.timeout_seconds,
        "status": "unknown",
        "status_code": None,
        "latency_ms": None,
        "error": None,
        "last_checked": None,
        "created_at": now,
    }
    inserted = await db["monitors"].insert_one(doc)
    doc["_id"] = inserted.inserted_id
    doc = await check_saved_monitor(db, doc)
    return _to_response(doc)


@router.post("/{monitor_id}/check", response_model=MonitorResponse)
async def check_monitor(monitor_id: str, db=Depends(get_database), user=Depends(get_current_user)):
    oid = _require_object_id(monitor_id, "monitor")
    doc = await db["monitors"].find_one({"_id": oid, "user_id": user["id"]})
    if doc is None:
        raise HTTPException(status_code=404, detail="Monitor not found")
    doc = await check_saved_monitor(db, doc)
    return _to_response(doc)


@router.delete("/{monitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_monitor(monitor_id: str, db=Depends(get_database), user=Depends(get_current_user)):
    oid = _require_object_id(monitor_id, "monitor")
    deleted = await db["monitors"].delete_one({"_id": oid, "user_id": user["id"]})
    if deleted.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Monitor not found")
