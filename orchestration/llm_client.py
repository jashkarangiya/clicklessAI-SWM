"""
OpenAI-compatible LLM client for the ASU ClickLess AI project.
Model: qwen3-235b-a22b-instruct-2507
"""
import os
import re
import json
import threading
from typing import Any, Callable

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

MODEL = "qwen3-235b-a22b-instruct-2507"
_TIMEOUT = 120.0   # longer timeout for streaming responses

_client: OpenAI | None = None

# ── Per-session streaming callback registry ───────────────────────────────────
# direct_chat_node looks up a callback here (by session_id) so it can forward
# tokens back to the WebSocket handler without coupling the node to FastAPI.
_stream_registry: dict[str, Callable[[str], None]] = {}
_stream_registry_lock = threading.Lock()


def register_stream_callback(session_id: str, cb: Callable[[str], None]) -> None:
    with _stream_registry_lock:
        _stream_registry[session_id] = cb


def unregister_stream_callback(session_id: str) -> None:
    with _stream_registry_lock:
        _stream_registry.pop(session_id, None)


def get_stream_callback(session_id: str) -> Callable[[str], None] | None:
    with _stream_registry_lock:
        return _stream_registry.get(session_id)


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            base_url="https://openai.rc.asu.edu/v1",
            api_key=os.getenv("API_KEY") or os.getenv("OPENAI_API_KEY"),
            timeout=_TIMEOUT,
        )
    return _client


def _strip_thinking(text: str) -> str:
    """Remove <think>…</think> blocks produced by Qwen3 thinking models."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def chat(messages: list[dict], temperature: float = 0.0) -> str:
    """Send a chat completion request and return the cleaned text response."""
    client = get_client()
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=temperature,
    )
    raw = response.choices[0].message.content or ""
    return _strip_thinking(raw)


def chat_stream(messages: list[dict], session_id: str = "", temperature: float = 0.0) -> str:
    """
    Streaming version of chat(). Calls the registered callback for session_id
    with each content token (think blocks are stripped before forwarding).
    Falls back to non-streaming if no callback is registered.
    Returns the full cleaned response text.
    """
    on_token = get_stream_callback(session_id) if session_id else None

    # No callback registered — fall back to regular (non-streaming) call
    if on_token is None:
        return chat(messages, temperature)

    client = get_client()
    full = ""

    # Qwen3 think blocks always appear FIRST in the response.
    # Buffer initial tokens until we determine whether a <think> block is present,
    # then stream only the actual content portion.
    past_think = False
    buffer = ""

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=temperature,
        stream=True,
    )
    for chunk in response:
        token = chunk.choices[0].delta.content or ""
        if not token:
            continue
        full += token

        if past_think:
            on_token(token)
        else:
            buffer += token
            if "</think>" in buffer:
                # Think block ended — start streaming content after it
                past_think = True
                after = buffer.split("</think>", 1)[1].lstrip("\n ")
                buffer = ""
                if after:
                    on_token(after)
            elif not buffer.startswith("<think>") and len(buffer) >= 8:
                # No think block — flush buffer and stream immediately
                past_think = True
                on_token(buffer)
                buffer = ""

    # Flush any leftover pre-think buffer
    if not past_think and buffer:
        cleaned = _strip_thinking(buffer)
        if cleaned:
            on_token(cleaned)

    return _strip_thinking(full)


def chat_json(messages: list[dict], temperature: float = 0.0) -> Any:
    """
    Same as chat() but parses the response as JSON.
    The prompt should instruct the model to respond ONLY with valid JSON.
    """
    raw = chat(messages, temperature)
    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$", "", raw.strip())
    data = json.loads(raw)
    # Model may return JSON `null`; downstream code expects a dict with .get()
    if data is None:
        return {}
    return data
