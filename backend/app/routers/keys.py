from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.database import get_database
from app.core.crypto import encrypt_api_key, decrypt_api_key, mask_api_key
from app.core.security import get_current_user
from app.models.api_key import ApiKeyCreate, ApiKeyResponse, BalanceTestRequest, BalanceTestResponse
from app.services.provider_checker import verify_provider_balance
from datetime import datetime
from bson import ObjectId
from typing import List, Optional

router = APIRouter(prefix="/keys", tags=["API Keys"])


def _to_response(doc: dict, key_id: str) -> ApiKeyResponse:
    checked = doc.get("last_checked_at") or datetime.utcnow()
    return ApiKeyResponse(
        id=key_id,
        projectId=doc["project_id"],
        providerId=doc["provider"],
        label=doc["label"],
        maskedKey=doc["masked_key"],
        balance=doc.get("balance", 0.0),
        maxQuota=doc.get("max_quota", 20.0),
        used=doc.get("used", 0.0),
        currency=doc.get("currency", "$"),
        status=doc.get("status", "healthy"),
        alertThreshold=doc.get("alert_threshold", 2.0),
        lastChecked=checked.isoformat() if hasattr(checked, "isoformat") else str(checked),
        notes=doc.get("notes", ""),
        endpoint=doc.get("endpoint"),
    )


async def _owned_project(db, project_id: str, user_id: str):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    project = await db["projects"].find_one({"_id": ObjectId(project_id), "user_id": user_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=List[ApiKeyResponse])
async def list_keys(
    project_id: Optional[str] = Query(None),
    db=Depends(get_database),
    user=Depends(get_current_user),
):
    filter_q = {"user_id": user["id"]}
    if project_id:
        filter_q["project_id"] = project_id

    keys = []
    cursor = db["api_keys"].find(filter_q).sort("created_at", -1)
    async for doc in cursor:
        keys.append(_to_response(doc, str(doc["_id"])))
    return keys


@router.post("/test", response_model=BalanceTestResponse)
async def test_key_balance(
    payload: BalanceTestRequest,
    user=Depends(get_current_user),
):
    try:
        verif = await verify_provider_balance(
            provider=payload.provider,
            plain_api_key=payload.raw_api_key,
            endpoint=payload.endpoint,
            alert_threshold=payload.alert_threshold,
            max_quota=payload.max_quota,
            current_balance=0.0,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return BalanceTestResponse(
        balance=verif["balance"],
        maxQuota=verif["maxQuota"],
        status=verif["status"],
        lastChecked=datetime.utcnow().isoformat(),
    )


@router.post("/", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def add_api_key(payload: ApiKeyCreate, db=Depends(get_database), user=Depends(get_current_user)):
    await _owned_project(db, payload.project_id, user["id"])
    raw_key = payload.raw_api_key.strip()
    if not raw_key:
        raise HTTPException(status_code=400, detail="API key is required")

    crypto_payload = encrypt_api_key(raw_key)
    masked = mask_api_key(raw_key)

    initial_balance = 0.0
    status_label = "healthy"
    try:
        verif = await verify_provider_balance(
            provider=payload.provider,
            plain_api_key=raw_key,
            endpoint=payload.endpoint,
            alert_threshold=payload.alert_threshold,
            max_quota=payload.max_quota,
            current_balance=initial_balance,
        )
        initial_balance = verif.get("balance", initial_balance)
        status_label = verif.get("status", "healthy")
    except Exception as exc:
        print(f"Initial provider check failed: {type(exc).__name__}")

    now = datetime.utcnow()
    doc = {
        "user_id": user["id"],
        "project_id": payload.project_id,
        "provider": payload.provider,
        "label": payload.label.strip() or payload.provider,
        "masked_key": masked,
        "encrypted_secret": crypto_payload["encrypted_secret"],
        "nonce": crypto_payload["nonce"],
        "balance": initial_balance,
        "max_quota": payload.max_quota,
        "used": max(0.0, round(payload.max_quota - initial_balance, 2)),
        "currency": payload.currency or "$",
        "status": status_label,
        "alert_threshold": payload.alert_threshold,
        "notes": payload.notes or "",
        "endpoint": payload.endpoint,
        "last_checked_at": now,
        "created_at": now,
    }

    res = await db["api_keys"].insert_one(doc)
    doc["last_checked_at"] = now
    return _to_response(doc, str(res.inserted_id))


@router.post("/{key_id}/sync", response_model=ApiKeyResponse)
async def sync_key_balance(key_id: str, db=Depends(get_database), user=Depends(get_current_user)):
    if not ObjectId.is_valid(key_id):
        raise HTTPException(status_code=400, detail="Invalid key ID format")

    doc = await db["api_keys"].find_one({"_id": ObjectId(key_id), "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="API key not found")

    try:
        plain_key = decrypt_api_key(doc["encrypted_secret"], doc["nonce"])
    except Exception:
        raise HTTPException(status_code=500, detail="Decryption failed. Authentication tag mismatch or corrupted record.")

    try:
        check_result = await verify_provider_balance(
            provider=doc["provider"],
            plain_api_key=plain_key,
            endpoint=doc.get("endpoint"),
            alert_threshold=doc.get("alert_threshold", 2.0),
            max_quota=doc.get("max_quota", 20.0),
            current_balance=doc.get("balance", 0.0),
        )
    finally:
        del plain_key

    new_balance = check_result["balance"]
    new_status = check_result["status"]
    new_used = max(0.0, round(doc.get("max_quota", 20.0) - new_balance, 2))
    now = datetime.utcnow()

    await db["api_keys"].update_one(
        {"_id": ObjectId(key_id)},
        {"$set": {
            "balance": new_balance,
            "status": new_status,
            "used": new_used,
            "last_checked_at": now,
        }},
    )

    doc["balance"] = new_balance
    doc["status"] = new_status
    doc["used"] = new_used
    doc["last_checked_at"] = now
    return _to_response(doc, key_id)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(key_id: str, db=Depends(get_database), user=Depends(get_current_user)):
    if not ObjectId.is_valid(key_id):
        raise HTTPException(status_code=400, detail="Invalid key ID format")
    deleted = await db["api_keys"].delete_one({"_id": ObjectId(key_id), "user_id": user["id"]})
    if deleted.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
