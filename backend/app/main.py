import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, db_instance
from app.routers import auth, projects, keys, monitors
from app.services.monitor_runner import monitor_loop

_docs_enabled = settings.ENVIRONMENT.strip().lower() != "production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    stop_monitors = asyncio.Event()
    monitor_task = asyncio.create_task(monitor_loop(stop_monitors))
    yield
    stop_monitors.set()
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass
    # Shutdown: Disconnect
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Encrypted API Quota & Balance Monitoring Engine for TikHub, OpenAI, 2Captcha, and custom endpoints.",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(keys.router, prefix=settings.API_V1_STR)
app.include_router(monitors.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    try:
        await db_instance.client.admin.command("ping")
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.get("/", tags=["Root"])
async def root():
    payload = {"message": f"Welcome to {settings.PROJECT_NAME}"}
    if _docs_enabled:
        payload["docs"] = "/docs"
        payload["openapi"] = "/openapi.json"
    return payload
