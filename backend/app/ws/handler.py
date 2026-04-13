"""
ClickLess AI – WebSocket handler

/ws                  — real-time bridge: frontend ↔ LangGraph orchestration
/ws/chat/{session_id} — legacy state-persistence endpoint (kept for compatibility)
"""
import asyncio
import json
import logging
import sys
import traceback
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.models.conversation import StateEnvelope
from app.services.conversation_service import get_state, save_state
from app.services import user_service
from app.services import chat_service

logger = logging.getLogger(__name__)
ws_router = APIRouter()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _summarize_node_output(node_name: str, node_output: object) -> str:
    if node_output is None:
        return f"{node_name}: output=None"
    if isinstance(node_output, dict):
        null_keys = [k for k, v in node_output.items() if v is None]
        keys = list(node_output.keys())
        return (
            f"{node_name}: keys={keys[:25]}"
            + (f" null_fields={null_keys[:20]}" if null_keys else "")
        )
    return f"{node_name}: type={type(node_output).__name__!r}"


def _log_state_values_snapshot(label: str, session_id: str, values: object) -> None:
    if not isinstance(values, dict):
        logger.info("[graph] %s session=%s values: not a dict (%s)", label, session_id, type(values).__name__)
        return
    null_keys = [k for k, v in values.items() if v is None]
    keys = list(values.keys())
    logger.info(
        "[graph] %s session=%s top_level_keys=%s null_top_level=%s",
        label, session_id, keys[:40], null_keys[:25],
    )
    q = values.get("query")
    if isinstance(q, dict):
        pq = q.get("parsed")
        logger.info("[graph] %s session=%s query.parsed type=%s", label, session_id, type(pq).__name__)


# ── Bootstrap orchestration path ──────────────────────────────────────────────
_ORCH_DIR = Path(__file__).resolve().parents[3] / "orchestration"
_REPO_ROOT = Path(__file__).resolve().parents[3]
for _p in [str(_ORCH_DIR), str(_REPO_ROOT)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from graph import app as _langgraph_app, build_graph  # type: ignore
    from state import new_state  # type: ignore
    from langgraph.types import Command  # type: ignore
    from llm_client import register_stream_callback, unregister_stream_callback  # type: ignore
    _GRAPH_AVAILABLE = True
    logger.info("LangGraph orchestration loaded successfully")
except Exception as exc:
    _GRAPH_AVAILABLE = False
    logger.warning("LangGraph not available: %s — WS will echo messages", exc)


# ── Node → status message mapping ────────────────────────────────────────────

_NODE_STATUS: Dict[str, str] = {
    "intent_detection":       "Analyzing your request…",
    "validate_enrich":        "Validating search parameters…",
    "product_search":         "Searching Amazon and Walmart…",
    "normalize_rank":         "Ranking results…",
    "present_results":        "Preparing results…",
    "purchase_confirmation":  "Preparing your order…",
    "execute_purchase":       "Placing order…",
    "update_preferences":     "Updating your preferences…",
    "error_recovery":         "Recovering from error…",
    "direct_chat":            "Thinking…",
}

# ── Per-session graph state ───────────────────────────────────────────────────

class _GraphSession:
    """Tracks LangGraph config + pending interrupt type per WebSocket session."""

    def __init__(self, session_id: str, user_id: str):
        self.session_id = session_id
        self.user_id = user_id
        self.config = {"configurable": {"thread_id": session_id}}
        self.pending: str | None = None
        self.current_products: list = []

    async def start(self, websocket: WebSocket, user_message: str) -> None:
        amazon_cookies: list = []
        try:
            amazon_session = await user_service.get_session(self.user_id, "amazon")
            if amazon_session and amazon_session.encrypted_state:
                amazon_cookies = json.loads(amazon_session.encrypted_state)
        except Exception as exc:
            logger.debug("Could not load Amazon session for user=%s: %s", self.user_id, exc)

        state = new_state(self.user_id, self.session_id, user_message)
        state["amazon_cookies"] = amazon_cookies
        await self._run(websocket, state)

    async def resume(self, websocket: WebSocket, resume_value) -> None:
        await self._run(websocket, Command(resume=resume_value))

    # ── Internal ──────────────────────────────────────────────────────────────

    async def _run(self, websocket: WebSocket, graph_input) -> None:
        gi_type = type(graph_input).__name__
        logger.info("[graph] run start session=%s graph_input_type=%s", self.session_id, gi_type)

        # ── Set up streaming token queue ──────────────────────────────────────
        loop = asyncio.get_running_loop()
        token_queue: asyncio.Queue[str | None] = asyncio.Queue()
        stream_message_id = str(uuid.uuid4())
        stream_started = False

        def _token_cb(token: str) -> None:
            """Called from worker thread by direct_chat_node via llm_client."""
            loop.call_soon_threadsafe(token_queue.put_nowait, token)

        register_stream_callback(self.session_id, _token_cb)

        async def _drain_tokens() -> None:
            nonlocal stream_started
            while True:
                token = await token_queue.get()
                if token is None:
                    break
                if not stream_started:
                    stream_started = True
                    await websocket.send_json({
                        "event": "stream_start",
                        "message_id": stream_message_id,
                    })
                await websocket.send_json({
                    "event": "stream_token",
                    "message_id": stream_message_id,
                    "token": token,
                })

        drain_task = asyncio.create_task(_drain_tokens())

        try:
            async for chunk in _langgraph_app.astream(
                graph_input, config=self.config, stream_mode="updates"
            ):
                if not isinstance(chunk, dict):
                    logger.warning("[graph] unexpected chunk type=%s session=%s", type(chunk), self.session_id)
                    continue
                for node_name, node_output in chunk.items():
                    logger.info(
                        "[graph] update session=%s %s",
                        self.session_id,
                        _summarize_node_output(node_name, node_output),
                    )
                    if node_name == "__interrupt__":
                        logger.info(
                            "[graph] interrupt session=%s payload_type=%s",
                            self.session_id, type(node_output).__name__,
                        )
                        # Signal drain to finish before handling interrupt
                        token_queue.put_nowait(None)
                        await drain_task
                        if stream_started:
                            await websocket.send_json({
                                "event": "stream_end",
                                "message_id": stream_message_id,
                            })
                        await self._handle_interrupt(websocket, node_output)
                        return
                    await self._send_status(websocket, node_name)

            # Graph finished — signal end of token stream
            token_queue.put_nowait(None)
            await drain_task

            if stream_started:
                # Tokens were streamed — send stream_end and save to history
                await websocket.send_json({
                    "event": "stream_end",
                    "message_id": stream_message_id,
                })
                # Persist the final cleaned text from graph state
                final = _langgraph_app.get_state(self.config)
                vals = getattr(final, "values", None) if final is not None else None
                _log_state_values_snapshot("finished", self.session_id, vals)
                if isinstance(vals, dict):
                    llm_text = vals.get("llm_response")
                    if llm_text:
                        await chat_service.upsert_message(
                            self.session_id, self.user_id,
                            {
                                "id": stream_message_id,
                                "role": "assistant",
                                "type": "text",
                                "content": llm_text,
                                "timestamp": _now(),
                            },
                        )
            else:
                # No streaming (e.g. product search path) — send assistant_message normally
                final = _langgraph_app.get_state(self.config)
                vals = getattr(final, "values", None) if final is not None else None
                _log_state_values_snapshot("finished", self.session_id, vals)
                if isinstance(vals, dict):
                    llm_text = vals.get("llm_response")
                    if llm_text:
                        await websocket.send_json({
                            "event": "assistant_message",
                            "content": llm_text,
                        })
                        await chat_service.upsert_message(
                            self.session_id, self.user_id,
                            {
                                "id": str(uuid.uuid4()),
                                "role": "assistant",
                                "type": "text",
                                "content": llm_text,
                                "timestamp": _now(),
                            },
                        )
            self.pending = None

        except Exception as exc:
            token_queue.put_nowait(None)
            try:
                await drain_task
            except Exception:
                pass
            traceback.print_exc(file=sys.stderr)
            sys.stderr.flush()
            logger.exception("Graph error on session %s", self.session_id)
            try:
                snap = _langgraph_app.get_state(self.config)
                err_vals = getattr(snap, "values", None) if snap is not None else None
                _log_state_values_snapshot("at_error", self.session_id, err_vals)
            except Exception as snap_exc:
                logger.warning("[graph] could not read state after error: %s", snap_exc)
            await websocket.send_json({
                "event": "error",
                "code": "GRAPH_ERROR",
                "message": str(exc),
                "retryable": True,
            })
        finally:
            unregister_stream_callback(self.session_id)

    async def _handle_interrupt(self, websocket: WebSocket, interrupt_output) -> None:
        interrupt_val = interrupt_output[0].value if interrupt_output else {}

        if isinstance(interrupt_val, dict) and interrupt_val.get("type") == "product_selection":
            self.current_products = interrupt_val.get("products", [])
            self.pending = "product_selection"
            await websocket.send_json({
                "event": "product_results",
                "products": self.current_products,
                "summary": interrupt_val.get("llm_comparison", ""),
            })
            # Save product results event to history
            await chat_service.upsert_message(
                self.session_id, self.user_id,
                {
                    "id": str(uuid.uuid4()),
                    "role": "assistant",
                    "type": "product_results",
                    "products": self.current_products,
                    "summary": interrupt_val.get("llm_comparison", ""),
                    "timestamp": _now(),
                },
            )

        elif isinstance(interrupt_val, dict) and interrupt_val.get("type") == "purchase_confirmation":
            self.pending = "purchase_confirmation"
            await websocket.send_json({
                "event": "confirmation_request",
                "confirmation": interrupt_val.get("confirmation", {}),
            })

        elif isinstance(interrupt_val, dict) and "question" in interrupt_val:
            options = interrupt_val.get("options", [])
            self.pending = "clarification"
            # Use the option value as the id so the resume receives the real
            # answer text ("Electronics") instead of a useless index ("o0").
            await websocket.send_json({
                "event": "clarification",
                "clarification": {
                    "question": interrupt_val["question"],
                    "options": [
                        {"id": o, "label": o, "value": o}
                        for o in options
                    ],
                    "free_text": len(options) == 0,
                    "field": interrupt_val.get("field_target", "query"),
                },
            })
        else:
            self.pending = "clarification"
            await websocket.send_json({
                "event": "clarification",
                "clarification": {
                    "question": str(interrupt_val),
                    "options": [],
                    "free_text": True,
                    "field": "query",
                },
            })

    async def _send_status(self, websocket: WebSocket, node_name: str) -> None:
        msg = _NODE_STATUS.get(node_name)
        if msg:
            await websocket.send_json({"event": "status_update", "message": msg})


# ── Direct buy helper ─────────────────────────────────────────────────────────

async def _handle_direct_buy(websocket: WebSocket, user_id: str, product: dict) -> None:
    import re

    product_url = product.get("source_url") or product.get("product_url", "")
    product_name = product.get("name", "the product")
    logger.warning("direct_buy: product_id=%s source_url=%r source_product_id=%r",
                   product.get("product_id"), product.get("source_url"), product.get("source_product_id"))

    asin_match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", product_url)
    if not asin_match and product_url:
        from urllib.parse import unquote
        asin_match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", unquote(product_url))
    if asin_match:
        asin = asin_match.group(1)
    else:
        asin = product.get("source_product_id") or product.get("asin") or None
        if not asin:
            pid = str(product.get("product_id") or "")
            pid_match = re.match(r'^amazon-([A-Z0-9]{10})$', pid)
            if pid_match:
                asin = pid_match.group(1)

    amazon_cookies: list = []
    try:
        amazon_session = await user_service.get_session(user_id, "amazon")
        logger.info("direct_buy: user_id=%s amazon_session_found=%s", user_id, amazon_session is not None)
        if amazon_session and amazon_session.encrypted_state:
            amazon_cookies = json.loads(amazon_session.encrypted_state)
    except Exception as exc:
        logger.warning("Could not load Amazon session for user=%s: %s", user_id, exc)

    await websocket.send_json({"event": "status_update", "message": "Adding to your Amazon cart…"})

    if not amazon_cookies:
        await websocket.send_json({
            "event": "assistant_message",
            "content": (
                "To add products to your Amazon cart, connect your Amazon account first.\n\n"
                "Go to **Settings → Connections** and click **Connect Amazon Account**."
            ),
        })
        return

    if not asin:
        await websocket.send_json({
            "event": "assistant_message",
            "content": (
                f"I couldn't extract the product ID for **{product_name}**. "
                f"[Open it on Amazon]({product_url}) and add it manually."
            ),
        })
        return

    try:
        if str(_REPO_ROOT) not in sys.path:
            sys.path.insert(0, str(_REPO_ROOT))
        from scraper.scrapers.amazon_cart import add_to_cart_http  # type: ignore

        result = await asyncio.get_running_loop().run_in_executor(
            None, add_to_cart_http, asin, amazon_cookies
        )

        if result.get("success"):
            cart_url = result.get("cart_url", "https://www.amazon.com/gp/cart/view.html")
            await websocket.send_json({
                "event": "assistant_message",
                "content": (
                    f"Done! **{product_name}** has been added to your Amazon cart.\n\n"
                    f"[View your cart]({cart_url}) to review and complete checkout."
                ),
            })
        else:
            error_msg = result.get("message", "Unknown error")
            if result.get("error") == "session_expired":
                await websocket.send_json({
                    "event": "assistant_message",
                    "content": (
                        "Your Amazon session has expired. Please reconnect your account in "
                        "**Settings → Connections**."
                    ),
                })
            else:
                await websocket.send_json({
                    "event": "assistant_message",
                    "content": f"Couldn't add to cart: {error_msg}",
                })
    except Exception as exc:
        logger.exception("direct_buy failed for user=%s asin=%s", user_id, asin)
        await websocket.send_json({
            "event": "assistant_message",
            "content": "Something went wrong while adding the product to your cart. Please try again.",
        })


# ── Active sessions registry ──────────────────────────────────────────────────

_graph_sessions: Dict[str, _GraphSession] = {}


def _get_or_create_session(session_id: str, user_id: str) -> _GraphSession:
    if session_id not in _graph_sessions:
        _graph_sessions[session_id] = _GraphSession(session_id, user_id)
    return _graph_sessions[session_id]


# ── /ws  —  primary real-time endpoint ───────────────────────────────────────

@ws_router.websocket("/ws")
async def realtime_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    await websocket.send_json({
        "event": "connection_status",
        "status": "connected",
        "message": "Connected to ClickLess AI",
    })

    session: _GraphSession | None = None

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"event": "error", "code": "INVALID_JSON", "message": "Bad JSON"})
                continue

            if not isinstance(event, dict):
                await websocket.send_json({
                    "event": "error",
                    "code": "INVALID_EVENT",
                    "message": "WebSocket JSON must be an object",
                    "retryable": False,
                })
                continue

            event_type = event.get("event", "")
            session_id = event.get("session_id") or str(uuid.uuid4())

            # ── User sends a new message ──────────────────────────────────────
            if event_type == "user_message":
                content: str = event.get("content", "")
                user_id: str = event.get("user_id", "anonymous")

                if not _GRAPH_AVAILABLE:
                    await websocket.send_json({
                        "event": "assistant_message",
                        "content": f"(Orchestration unavailable) Echo: {content}",
                    })
                    continue

                session = _get_or_create_session(session_id, user_id)

                # Save user message to MongoDB
                msg_id = str(uuid.uuid4())
                await chat_service.upsert_message(
                    session_id, user_id,
                    {
                        "id": msg_id,
                        "role": "user",
                        "type": "text",
                        "content": content,
                        "timestamp": _now(),
                    },
                    title=content[:60],  # first user message becomes the session title
                )

                if session.pending == "product_selection":
                    if content.lower().startswith("confirm_buy:"):
                        product_id = content.split(":", 1)[1].strip()
                        idx = next(
                            (i for i, p in enumerate(session.current_products)
                             if p.get("product_id") == product_id),
                            0,
                        )
                        await session.resume(websocket, {"action": "select", "product_index": idx})
                    else:
                        await session.resume(websocket, {"action": "refine", "refinement_text": content})
                else:
                    await session.start(websocket, content)

            # ── Clarification reply ───────────────────────────────────────────
            elif event_type == "clarification_reply":
                if session and session.pending == "clarification":
                    answer = event.get("free_text") or event.get("option_id", "")
                    await session.resume(websocket, answer)

            # ── Direct buy from product card (bypasses LangGraph) ────────────
            elif event_type == "direct_buy":
                product = event.get("product") or {}
                user_id = event.get("user_id", "anonymous")
                await _handle_direct_buy(websocket, user_id, product)

            # ── Purchase confirm / cancel ─────────────────────────────────────
            elif event_type == "purchase_confirm":
                if session and session.pending == "purchase_confirmation":
                    confirmed = bool(event.get("confirmed", False))
                    await session.resume(websocket, {"confirmed": confirmed})

    except WebSocketDisconnect:
        sid = session.session_id if session else "unknown"
        logger.info("WebSocket disconnected: %s", sid)
        if session and session.session_id in _graph_sessions:
            del _graph_sessions[session.session_id]


# ── /ws/chat/{session_id}  —  legacy state-persistence endpoint ───────────────

class ConnectionManager:
    def __init__(self) -> None:
        self.active: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active[session_id] = websocket

    def disconnect(self, session_id: str) -> None:
        self.active.pop(session_id, None)

    async def send(self, session_id: str, message: dict) -> None:
        ws = self.active.get(session_id)
        if ws:
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
            except Exception as exc:
                logger.warning("Invalid message on session %s: %s", session_id, exc)
                await websocket.send_json({"error": "invalid_message", "detail": str(exc)})
    except WebSocketDisconnect:
        manager.disconnect(session_id)
