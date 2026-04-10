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

    def test_websocket_reconnect_replays_existing_state(self, sync_client: TestClient):
        """On reconnect, server immediately sends the last persisted envelope."""
        session_id = "ws_sess_005"
        existing = _mock_envelope(session_id, turn_id="turn_007")

        with (
            patch("app.ws.handler.get_state", new_callable=AsyncMock, return_value=existing),
            patch("app.ws.handler.save_state", new_callable=AsyncMock, side_effect=lambda e: e),
        ):
            with sync_client.websocket_connect(f"/ws/chat/{session_id}") as ws:
                replayed = ws.receive_json()
                assert replayed["session_id"] == session_id
                assert replayed["turn_id"] == "turn_007"

    def test_websocket_invalid_envelope_fields(self, sync_client: TestClient):
        """Valid JSON but missing required StateEnvelope fields returns an error."""
        with (
            patch("app.ws.handler.get_state", new_callable=AsyncMock, return_value=None),
            patch("app.ws.handler.save_state", new_callable=AsyncMock, side_effect=lambda e: e),
        ):
            with sync_client.websocket_connect("/ws/chat/ws_sess_006") as ws:
                ws.send_json({"not_a_field": "garbage"})
                response = ws.receive_json()
                assert "error" in response

    def test_websocket_status_field_preserved(self, sync_client: TestClient):
        """The status field sent by the client is preserved in the echoed response."""
        session_id = "ws_sess_007"

        def _echo(envelope: StateEnvelope) -> StateEnvelope:
            return envelope

        with (
            patch("app.ws.handler.get_state", new_callable=AsyncMock, return_value=None),
            patch("app.ws.handler.save_state", new_callable=AsyncMock, side_effect=_echo),
        ):
            msg = {
                "session_id": session_id,
                "user_id": "user_ws_003",
                "turn_id": "turn_001",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "needs_clarification",
                "query": "headphones",
                "missing_fields": ["budget"],
                "clarification": "What is your budget?",
            }
            with sync_client.websocket_connect(f"/ws/chat/{session_id}") as ws:
                ws.send_json(msg)
                response = ws.receive_json()
                assert response["status"] == "needs_clarification"
                assert response["missing_fields"] == ["budget"]

    def test_websocket_different_sessions_are_isolated(self, sync_client: TestClient):
        """Two concurrent sessions do not interfere with each other."""
        sid_a, sid_b = "ws_sess_008", "ws_sess_009"

        def _echo(envelope: StateEnvelope) -> StateEnvelope:
            return envelope

        with (
            patch("app.ws.handler.get_state", new_callable=AsyncMock, return_value=None),
            patch("app.ws.handler.save_state", new_callable=AsyncMock, side_effect=_echo),
        ):
            msg_a = {
                "session_id": sid_a, "user_id": "user_a", "turn_id": "t1",
                "timestamp": datetime.now(timezone.utc).isoformat(), "status": "ready",
            }
            msg_b = {
                "session_id": sid_b, "user_id": "user_b", "turn_id": "t1",
                "timestamp": datetime.now(timezone.utc).isoformat(), "status": "executing",
            }
            with sync_client.websocket_connect(f"/ws/chat/{sid_a}") as ws_a:
                with sync_client.websocket_connect(f"/ws/chat/{sid_b}") as ws_b:
                    ws_a.send_json(msg_a)
                    ws_b.send_json(msg_b)
                    resp_a = ws_a.receive_json()
                    resp_b = ws_b.receive_json()
                    assert resp_a["session_id"] == sid_a
                    assert resp_b["session_id"] == sid_b
                    assert resp_a["status"] == "ready"
                    assert resp_b["status"] == "executing"
