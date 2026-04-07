"""
purchase_confirmation node — hard gate.
Builds a full confirmation payload and interrupts until the user explicitly confirms.
No purchase can proceed without user_confirmed = True.
"""
import uuid
from datetime import datetime, timedelta, timezone
from langgraph.types import interrupt

from state import AgentState

CONFIRMATION_TIMEOUT_MINUTES = 15
HIGH_VALUE_THRESHOLD = 500.0


def purchase_confirmation_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("purchase_confirmation")

    product = state.get("selected_product")
    prefs = state["user_preferences"]

    if not product:
        state["errors"].append({
            "category": "fatal",
            "node": "purchase_confirmation",
            "message": "No product selected for purchase confirmation.",
        })
        state["status"] = "failed"
        return state

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=CONFIRMATION_TIMEOUT_MINUTES)

    # ── Build confirmation payload ────────────────────────────────────────────
    # All fields must be non-null before presenting to user (per design doc §8.2)
    delivery_address = (
        prefs.get("explicit", {}).get("default_address")
        or state["query"]["parsed"].get("delivery_address")
        or "Address not set — please update in settings"
    )
    payment_info = (
        prefs.get("explicit", {}).get("default_payment")
        or state["query"]["parsed"].get("payment_method")
        or {"method": "Unknown", "last_four": "????", "source": "not configured"}
    )
    if isinstance(payment_info, str):
        payment_info = {"method": payment_info, "last_four": "????", "source": "saved"}

    price = product.get("pricing", {}).get("current_price", 0)

    confirmation = {
        "confirmation_id": str(uuid.uuid4()),
        "status": "awaiting_user_confirmation",
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "product": {
            "name": product.get("name", ""),
            "price": price,
            "original_price": product.get("pricing", {}).get("original_price"),
            "source": product.get("source", ""),
            "url": product.get("source_url", ""),
            "image_url": product.get("images", {}).get("primary", ""),
        },
        "delivery": {
            "address": delivery_address,
            "estimated_date": product.get("delivery", {}).get("estimated_date"),
            "method": "Prime Free Shipping" if product.get("delivery", {}).get("prime_eligible") else "Standard Shipping",
            "speed": "2-day" if product.get("delivery", {}).get("prime_eligible") else "5–7 days",
        },
        "payment": payment_info,
        "user_confirmed": False,
        "confirmed_at": None,
        "order_id": None,
        "confirmation_screenshot": None,
    }

    state["purchase_confirmation"] = confirmation

    # ── High-value double-confirmation flag ───────────────────────────────────
    double_confirm_required = price >= HIGH_VALUE_THRESHOLD

    interrupt_payload = {
        "type": "purchase_confirmation",
        "confirmation": confirmation,
        "double_confirm_required": double_confirm_required,
    }

    # ── Wait for explicit user confirmation ───────────────────────────────────
    # Expected resume value:
    #   {"confirmed": true}   — user clicked "Confirm Purchase"
    #   {"confirmed": false}  — user clicked "Cancel"
    user_response: dict = interrupt(interrupt_payload)

    confirmed = bool(user_response.get("confirmed", False))
    state["purchase_confirmation"]["user_confirmed"] = confirmed
    state["purchase_confirmation"]["status"] = "confirmed" if confirmed else "cancelled"

    if confirmed:
        state["purchase_confirmation"]["confirmed_at"] = datetime.now(timezone.utc).isoformat()
        state["status"] = "ready"
    else:
        state["status"] = "completed"

    return state
