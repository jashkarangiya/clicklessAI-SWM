from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.mongo import ensure_indexes
from app.db.postgres import create_tables
from app.routers import cache, conversations, orders, sessions, system, users
from app.ws.handler import ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes()
    await create_tables()
    yield


settings = get_settings()

app = FastAPI(
    title="ClickLess AI",
    description="Human-in-the-loop conversational web automation platform",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router)
app.include_router(users.router, prefix="/api/users")
app.include_router(sessions.router, prefix="/api/sessions")
app.include_router(orders.router, prefix="/api/orders")
app.include_router(cache.router, prefix="/api/cache")
app.include_router(conversations.router, prefix="/api/conversations")
app.include_router(ws_router)
