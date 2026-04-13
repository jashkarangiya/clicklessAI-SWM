"""
ClickLess AI – Security utilities
JWT tokens (HMAC-SHA256, no external JWT lib needed) + PBKDF2 password hashing.
"""
import base64
import hashlib
import hmac
import json
import os
import time

from app.core.config import get_settings

# ── Token helpers ─────────────────────────────────────────────────────────────

_TOKEN_TTL = 7 * 24 * 3600  # 7 days


def _secret() -> bytes:
    return get_settings().app_secret_key.encode()


def create_token(user_id: str, email: str) -> str:
    payload = {"user_id": user_id, "email": email, "exp": time.time() + _TOKEN_TTL}
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig = hmac.new(_secret(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


def verify_token(token: str) -> dict | None:
    """Returns payload dict if valid and not expired, else None."""
    try:
        payload_b64, sig = token.rsplit(".", 1)
        expected = hmac.new(_secret(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return None
        padding = 4 - len(payload_b64) % 4
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "=" * padding))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


# ── Password helpers ──────────────────────────────────────────────────────────

_ITERATIONS = 260_000
_HASH_NAME = "sha256"
_SALT_LEN = 16


def hash_password(password: str) -> str:
    salt = os.urandom(_SALT_LEN)
    dk = hashlib.pbkdf2_hmac(_HASH_NAME, password.encode(), salt, _ITERATIONS)
    return f"pbkdf2${_ITERATIONS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt_hex, dk_hex = stored.split("$")
        salt = bytes.fromhex(salt_hex)
        dk = hashlib.pbkdf2_hmac(_HASH_NAME, password.encode(), salt, int(iterations))
        return hmac.compare_digest(dk.hex(), dk_hex)
    except Exception:
        return False
