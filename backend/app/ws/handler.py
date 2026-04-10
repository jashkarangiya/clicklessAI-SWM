import json
import logging
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.models.conversation import StateEnvelope
from app.services.conversation_service import get_state, save_state

logger = logging.getLogger(__name__)

ws_router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self.active: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active[session_id] = websocket
        logger.info("WebSocket connected: %s", session_id)

    def disconnect(self, session_id: str) -> None:
        self.active.pop(session_id, None)
        logger.info("WebSocket disconnected: %s", session_id)

    async def send(self, session_id: str, message: dict) -> None:
        ws = self.active.get(session_id)
        if ws:
            await ws.send_json(message)

    async def broadcast(self, message: dict) -> None:
        for ws in self.active.values():
            await ws.send_json(message)


manager = ConnectionManager()


@ws_router.websocket("/ws/chat/{session_id}")
async def chat_endpoint(websocket: WebSocket, session_id: str) -> None:
    await manager.connect(session_id, websocket)
    try:
        existing = await get_state(session_id)
        if existing:
            await websocket.send_json(existing.model_dump(mode="json"))

        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                envelope = StateEnvelope(**data)
                saved = await save_state(envelope)
                await websocket.send_json(saved.model_dump(mode="json"))
            except (json.JSONDecodeError, Exception) as exc:
                logger.warning("Invalid message on session %s: %s", session_id, exc)
                await websocket.send_json(
                    {"error": "invalid_message", "detail": str(exc)}
                )
    except WebSocketDisconnect:
        manager.disconnect(session_id)
