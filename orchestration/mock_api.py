"""
Mock implementation of Member C's backend API.
In production these become HTTP calls to FastAPI endpoints:
  GET  /api/users/{user_id}/preferences
  PATCH /api/users/{user_id}/preferences
  GET  /api/users/{user_id}/preferences/weights
  PATCH /api/users/{user_id}/preferences/weights
"""
import json
import copy
from pathlib import Path

_FIXTURES_PATH = Path(__file__).parent / "fixtures" / "users.json"

# In-memory store: user_id → user document
_store: dict[str, dict] = {}


def _load_fixtures():
    """Seed the in-memory store from fixtures/users.json on first use."""
    global _store
    if _store:
        return
    if _FIXTURES_PATH.exists():
        users = json.loads(_FIXTURES_PATH.read_text())
        for u in users:
            _store[u["user_id"]] = copy.deepcopy(u)


def get_user_preferences(user_id: str) -> dict:
    """Return the full preferences object for a user (or sensible defaults)."""
    _load_fixtures()
    user = _store.get(user_id)
    if user:
        return copy.deepcopy(user.get("preferences", {}))
    # New user – return defaults
    return {
        "explicit": {},
        "implicit": {
            "avg_purchase_price": None,
            "price_sensitivity": 0.5,
            "rating_threshold": 4.0,
            "review_count_threshold": 100,
            "categories_browsed": [],
            "sort_tendency": None,
        },
        "weights": {
            "price": 0.30,
            "rating": 0.25,
            "delivery": 0.20,
            "preference_match": 0.25,
        },
    }


def get_scoring_weights(user_id: str) -> dict:
    prefs = get_user_preferences(user_id)
    return prefs.get("weights", {
        "price": 0.30,
        "rating": 0.25,
        "delivery": 0.20,
        "preference_match": 0.25,
    })


def update_user_preferences(user_id: str, updates: dict) -> dict:
    """
    Merge preference updates into the user's document.
    updates = {
      "explicit": [{"field": "preferred_brands", "value": "Sony", "confidence": 0.9}],
      "implicit": [...],
      "rejections": [...],
    }
    """
    _load_fixtures()
    if user_id not in _store:
        _store[user_id] = {
            "user_id": user_id,
            "preferences": get_user_preferences(user_id),
            "purchase_history": [],
            "rejected_products": [],
        }

    prefs = _store[user_id].setdefault("preferences", {})
    explicit = prefs.setdefault("explicit", {})
    implicit = prefs.setdefault("implicit", {})

    for item in updates.get("explicit", []):
        field, value = item["field"], item["value"]
        if field in ("preferred_brands", "avoided_brands"):
            lst = explicit.setdefault(field, [])
            if isinstance(value, list):
                for v in value:
                    if v not in lst:
                        lst.append(v)
            elif value not in lst:
                lst.append(value)
        else:
            explicit[field] = value

    for item in updates.get("implicit", []):
        implicit[item["field"]] = item["value"]

    for rej in updates.get("rejections", []):
        _store[user_id].setdefault("rejected_products", []).append({
            "product": rej.get("product"),
            "reason": rej.get("reason"),
        })

    return copy.deepcopy(prefs)


def update_scoring_weights(user_id: str, weights: dict) -> dict:
    _load_fixtures()
    _store.setdefault(user_id, {"user_id": user_id, "preferences": {}})
    _store[user_id]["preferences"]["weights"] = copy.deepcopy(weights)
    return weights


def log_order(user_id: str, order: dict) -> None:
    _load_fixtures()
    _store.setdefault(user_id, {"user_id": user_id})
    _store[user_id].setdefault("purchase_history", []).append(order)
