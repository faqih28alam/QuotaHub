import asyncio

from app.core.config import settings
from app.core.database import db_instance
from app.services.monitor_checker import run_check
from datetime import datetime


def _result_fields(result) -> dict:
    return {
        "status": result.status,
        "status_code": result.status_code,
        "latency_ms": result.latency_ms,
        "error": result.error,
        "last_checked": datetime.utcnow(),
    }


async def check_saved_monitor(db, doc) -> dict:
    result = await run_check(
        url=doc["url"],
        route=doc.get("route", "public"),
        expected_status=int(doc.get("expected_status") or 200),
        timeout_seconds=float(doc.get("timeout_seconds") or 5),
    )
    fields = _result_fields(result)
    await db["monitors"].update_one({"_id": doc["_id"]}, {"$set": fields})
    doc.update(fields)
    return doc


async def sweep_monitors() -> None:
    db = db_instance.db
    if db is None:
        return
    docs = await db["monitors"].find({}).to_list(500)
    if not docs:
        return

    semaphore = asyncio.Semaphore(5)

    async def one(doc):
        async with semaphore:
            try:
                await check_saved_monitor(db, doc)
            except Exception as exc:
                print(f"Monitor check failed: {type(exc).__name__}")

    await asyncio.gather(*(one(doc) for doc in docs))


async def monitor_loop(stop: asyncio.Event) -> None:
    interval = max(15, int(settings.MONITOR_CHECK_INTERVAL_SECONDS))
    while not stop.is_set():
        try:
            await sweep_monitors()
        except Exception as exc:
            print(f"Monitor sweep failed: {type(exc).__name__}")
        try:
            await asyncio.wait_for(stop.wait(), timeout=interval)
        except asyncio.TimeoutError:
            continue
