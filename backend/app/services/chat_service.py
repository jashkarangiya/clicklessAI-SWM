"""
ClickLess AI – Chat Session Service

Persists chat sessions (title + serialized messages) to MongoDB.
Used by the WebSocket handler to save history and by the conversations
router to serve the sidebar session list and session restore.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.db.mongo import get_chat_sessions_collection

logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def upsert_message(
    session_id: str,
    user_id: str,
    message: dict[str, Any],
    title: str | None = None,
) -> None:
    """
    Append a single message to the session document.
    Creates the document if it doesn't exist yet.
    `title` is only set once (on the first user message).
    """
    try:
        col = get_chat_sessions_collection()
        now = _now()
        update: dict[str, Any] = {
            "$set": {"user_id": user_id, "updated_at": now},
            "$push": {"messages": message},
            "$setOnInsert": {"session_id": session_id, "created_at": now},
        }
        if title:
            # Only set title if the document is being inserted for the first time
            update["$setOnInsert"]["title"] = title  # type: ignore[index]
        await col.update_one({"session_id": session_id}, update, upsert=True)

        # If title wasn't set on insert (doc already existed), set it if still missing
        if title:
            await col.update_one(
                {"session_id": session_id, "title": {"$exists": False}},
                {"$set": {"title": title}},
            )
    except Exception as exc:
        logger.warning("chat_service.upsert_message failed: %s", exc)


async def list_sessions(user_id: str, limit: int = 50) -> list[dict]:
    """Return recent sessions for the sidebar (metadata only, no messages)."""
    try:
        col = get_chat_sessions_collection()
        cursor = col.find(
            {"user_id": user_id},
            {"_id": 0, "session_id": 1, "title": 1, "created_at": 1, "updated_at": 1},
        ).sort("updated_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    except Exception as exc:
        logger.warning("chat_service.list_sessions failed: %s", exc)
        return []


async def get_session_messages(session_id: str) -> list[dict]:
    """Return the serialized message list for a session."""
    try:
        col = get_chat_sessions_collection()
        doc = await col.find_one(
            {"session_id": session_id},
            {"_id": 0, "messages": 1},
        )
        return doc.get("messages", []) if doc else []
    except Exception as exc:
        logger.warning("chat_service.get_session_messages failed: %s", exc)
        return []


async def delete_session(session_id: str) -> bool:
    try:
        col = get_chat_sessions_collection()
        result = await col.delete_one({"session_id": session_id})
        return result.deleted_count > 0
    except Exception as exc:
        logger.warning("chat_service.delete_session failed: %s", exc)
        return False
