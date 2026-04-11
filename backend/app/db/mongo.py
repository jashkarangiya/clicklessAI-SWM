from __future__ import annotations

import asyncio

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

_client: AsyncIOMotorClient | None = None
_client_loop_id: int | None = None


def _current_loop_id() -> int:
    try:
        return id(asyncio.get_running_loop())
    except RuntimeError:
        return 0


def get_client() -> AsyncIOMotorClient:
    global _client, _client_loop_id
    lid = _current_loop_id()
    if _client is None or _client_loop_id != lid:
        _client = AsyncIOMotorClient(get_settings().mongodb_url)
        _client_loop_id = lid
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[get_settings().mongodb_db_name]


def get_users_collection():
    return get_db()["users"]


def get_conversations_collection():
    return get_db()["conversations"]


async def ensure_indexes() -> None:
    users = get_users_collection()
    await users.create_index("user_id", unique=True)
    await users.create_index("email", unique=True)
    await users.create_index([("last_active", -1)])

    conversations = get_conversations_collection()
    await conversations.create_index("session_id", unique=True)
