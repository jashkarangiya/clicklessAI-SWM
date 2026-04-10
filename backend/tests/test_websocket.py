"""WebSocket endpoint tests for ClickLess AI.

Starlette's TestClient runs the ASGI app in a background thread with its own
event loop.  Motor (MongoDB) and Redis clients are bound to the session event
loop created by the async test suite, so calling them from the TestClient
thread raises "Event loop is closed".

Solution: patch the conversation-service functions used by the WS handler so
the WebSocket tests never touch live DB clients.
"""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.conversation import StateEnvelope
from app.models.shared import Status


@pytest.fixture(scope="module")
def sync_client():
    return TestClient(app)


def _mock_envelope(session_id: str, turn_id: str = "turn_001") -> StateEnvelope:
    return StateEnvelope(
        session_id=session_id,
        user_id="user_ws_mock",
        turn_id=turn_id,
        timestamp=datetime.now(timezone.utc),
        status=Status.ready,
        query="test query",
    )


class TestWebSocket:
    def test_websocket_connect_and_close(self, sync_client: TestClient):
        """Connection opens and closes without error."""
        with (
            patch("app.ws.handler.get_state", new_callable=AsyncMock, return_value=None),
            patch("app.ws.handler.save_state", new_callable=AsyncMock,
                  side_effect=lambda e: e),
        ):
            with sync_client.websocket_connect("/ws/chat/ws_sess_001") as ws:
                ws.close()

    def test_websocket_send_state_envelope(self, sync_client: TestClient):
        """Send a valid StateEnvelope, expect it echoed back."""
        session_id = "ws_sess_002"
        saved = _mock_envelope(session_id)

        with (
            patch("app.ws.handler.get_state", new_callable=AsyncMock, return_value=None),
            patch("app.ws.handler.save_state", new_callable=AsyncMock,
                  return_value=saved),
        ):
            envelope = {
                "session_id": session_id,
                "user_id": "user_ws_001",
                "turn_id": "turn_001",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "query": "find me a laptop under 1000",
            }
            with sync_client.websocket_connect(f"/ws/chat/{session_id}") as ws:
                ws.send_json(envelope)
                response = ws.receive_json()
                assert response["session_id"] == session_id

    def test_websocket_invalid_json(self, sync_client: TestClient):
        """Invalid JSON is handled gracefully — server returns error message."""
        with (
            patch("app.ws.handler.get_state", new_callable=AsyncMock, return_value=None),
            patch("app.ws.handler.save_state", new_callable=AsyncMock,
                  side_effect=lambda e: e),
        ):
            with sync_client.websocket_connect("/ws/chat/ws_sess_003") as ws:
                ws.send_text("not valid json {{{{")
                response = ws.receive_json()
                assert "error" in response

    def test_websocket_multiple_turns(self, sync_client: TestClient):
        """Multiple turns in one connection each get a response."""
        session_id = "ws_sess_004"

        def _echo(envelope: StateEnvelope) -> StateEnvelope:
            return envelope

        with (
            patch("app.ws.handler.get_state", new_callable=AsyncMock, return_value=None),
            patch("app.ws.handler.save_state", new_callable=AsyncMock,
                  side_effect=_echo),
        ):
            with sync_client.websocket_connect(f"/ws/chat/{session_id}") as ws:
                for turn_id in ["turn_001", "turn_002", "turn_003"]:
                    msg = {
                        "session_id": session_id,
                        "user_id": "user_ws_002",
                        "turn_id": turn_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "status": "ready",
                        "query": f"query for {turn_id}",
                    }
                    ws.send_json(msg)
                    response = ws.receive_json()
                    assert response["turn_id"] == turn_id
