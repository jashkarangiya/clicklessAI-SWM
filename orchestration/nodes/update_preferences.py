"""
update_preferences node — extracts explicit/implicit preferences from the interaction
and persists them via mock_api (or Member C's API in production).
"""
from state import AgentState
from llm_client import chat_json
from prompts import preference_extraction_prompt
from mock_api import update_user_preferences, update_scoring_weights, log_order
from scoring import adapt_weights


def update_preferences_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("update_preferences")

    conversation_history = state.get("conversation_history", [])
    chosen_product = state.get("selected_product")
    all_products = state.get("products", [])

    # Collect rejected products (products that were shown but not selected)
    rejected = []
    if chosen_product:
        chosen_id = chosen_product.get("product_id") or chosen_product.get("source_url")
        for p in all_products:
            pid = p.get("product_id") or p.get("source_url")
            if pid != chosen_id:
                rejected.append({"product": p.get("name", ""), "reason": "not_selected"})

    # ── LLM preference extraction ─────────────────────────────────────────────
    pref_updates = {"explicit": [], "implicit": [], "rejections": rejected}
    try:
        messages = preference_extraction_prompt(conversation_history, chosen_product, rejected)
        extracted = chat_json(messages)
        pref_updates["explicit"] = extracted.get("explicit", [])
        pref_updates["implicit"] = extracted.get("implicit", [])
        pref_updates["rejections"].extend(extracted.get("rejections", []))
    except Exception:
        pass  # best-effort; don't fail the whole flow

    # ── Persist preference updates ────────────────────────────────────────────
    if any(pref_updates.values()):
        update_user_preferences(state["user_id"], pref_updates)
        state["preference_updates"] = pref_updates.get("explicit", []) + pref_updates.get("implicit", [])

    # ── Adapt scoring weights ─────────────────────────────────────────────────
    if chosen_product:
        from mock_api import get_scoring_weights
        current_weights = get_scoring_weights(state["user_id"])
        new_weights = adapt_weights(current_weights, chosen_product, all_products)
        update_scoring_weights(state["user_id"], new_weights)

    # ── Log confirmed order ───────────────────────────────────────────────────
    confirmation = state.get("purchase_confirmation", {})
    if confirmation.get("user_confirmed") and confirmation.get("order_id"):
        log_order(state["user_id"], {
            "order_id": confirmation["order_id"],
            "product": confirmation["product"].get("name", ""),
            "price": confirmation["product"].get("price"),
            "site": confirmation["product"].get("source", ""),
            "date": confirmation.get("confirmed_at", "")[:10],
            "satisfaction": None,
        })

    state["status"] = "completed"
    return state
