import asyncio
from typing import Optional

from redis.asyncio import Redis, from_url

from app.core.config import get_settings

_redis: Redis | None = None
_redis_loop_id: int | None = None


def _current_loop_id() -> int:
    try:
        return id(asyncio.get_running_loop())
    except RuntimeError:
        return 0


async def get_redis() -> Redis:
    global _redis, _redis_loop_id
    lid = _current_loop_id()
    if _redis is None or _redis_loop_id != lid:
        _redis = await from_url(get_settings().redis_url, decode_responses=True)
        _redis_loop_id = lid
    return _redis


async def cache_get(key: str) -> Optional[str]:
    r = await get_redis()
    return await r.get(key)


async def cache_set(key: str, value: str, ttl: int) -> None:
    r = await get_redis()
    await r.set(key, value, ex=ttl)


async def cache_delete(key: str) -> None:
    r = await get_redis()
    await r.delete(key)


def product_cache_key(query_hash: str) -> str:
    return f"product_cache:{query_hash}"


def session_state_key(user_id: str, site: str) -> str:
    return f"session_state:{user_id}:{site}"


def confirmation_key(session_id: str) -> str:
    return f"confirmation:{session_id}"
