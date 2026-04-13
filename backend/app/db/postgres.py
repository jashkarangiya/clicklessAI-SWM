from __future__ import annotations

import asyncio
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

_state: dict[int, dict[str, Any]] = {}


def _current_loop_id() -> int:
    try:
        return id(asyncio.get_running_loop())
    except RuntimeError:
        return 0


def _get_state() -> dict[str, Any]:
    lid = _current_loop_id()
    if lid not in _state:
        engine = create_async_engine(
            get_settings().postgres_url,
            echo=False,
            connect_args={"timeout": 3},
        )
        factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        _state[lid] = {"engine": engine, "factory": factory}
    return _state[_current_loop_id()]


def get_session_factory() -> async_sessionmaker:
    return _get_state()["factory"]


async def create_tables() -> None:
    engine = _get_state()["engine"]
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS orders (
                order_id          TEXT PRIMARY KEY,
                user_id           TEXT NOT NULL,
                product_id        TEXT NOT NULL,
                source            TEXT NOT NULL,
                product_name      TEXT NOT NULL,
                price             NUMERIC(10,2) NOT NULL,
                site_order_id     TEXT,
                status            TEXT NOT NULL DEFAULT 'placed',
                payment_last_four TEXT,
                delivery_address  TEXT,
                created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)"
        ))


async def get_session():
    async with get_session_factory()() as session:
        yield session
