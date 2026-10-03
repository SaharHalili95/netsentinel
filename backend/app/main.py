import logging
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.database import engine, Base
from app.tasks.scheduler import start_scheduler, stop_scheduler

logger = logging.getLogger("netsentinel")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if not settings.api_key:
        settings.api_key = secrets.token_urlsafe(32)
        logger.warning(
            "No API_KEY configured - generated one for this run (printed to "
            "stdout below, not to the structured log). The frontend needs the "
            "same value in NEXT_PUBLIC_API_KEY or its scan/edit/delete actions "
            "will 401. Set API_KEY explicitly for a stable key across restarts."
        )
        print(f"[netsentinel] Generated API_KEY for this run: {settings.api_key}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()
    await engine.dispose()


app = FastAPI(
    title="NetSentinel",
    description="Network Monitoring & Intrusion Detection Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "netsentinel"}
