import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.mongo import ensure_indexes
from app.db.postgres import create_tables
from app.routers import amazon_auth, auth, cache, conversations, orders, sessions, system, users
from app.ws.handler import ws_router


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(level=logging.INFO)
    logging.getLogger("app").setLevel(logging.INFO)
    try:
        await ensure_indexes()
    except Exception as exc:
        logger.warning("MongoDB unavailable — skipping index creation: %s", exc)
    try:
        await create_tables()
    except Exception as exc:
        logger.warning("Postgres unavailable — skipping table creation: %s", exc)
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
app.include_router(auth.router)
app.include_router(amazon_auth.router)
app.include_router(users.router, prefix="/api/users")
app.include_router(sessions.router, prefix="/api/sessions")
app.include_router(orders.router, prefix="/api/orders")
app.include_router(cache.router, prefix="/api/cache")
app.include_router(conversations.router, prefix="/api/conversations")
app.include_router(ws_router)
