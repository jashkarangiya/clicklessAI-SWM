"""
OpenAI-compatible LLM client for the ASU ClickLess AI project.
Model: qwen3-235b-a22b-thinking-2507  (thinking model — strips <think> blocks automatically)
"""
import os
import re
import json
from typing import Any

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

MODEL = "qwen3-235b-a22b-thinking-2507"

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            base_url="https://openai.rc.asu.edu/v1",
            api_key=os.getenv("API_KEY"),
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


def chat_json(messages: list[dict], temperature: float = 0.0) -> Any:
    """
    Same as chat() but parses the response as JSON.
    The prompt should instruct the model to respond ONLY with valid JSON.
    """
    raw = chat(messages, temperature)
    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$", "", raw.strip())
    return json.loads(raw)
