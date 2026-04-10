"""
execute_purchase node — stub for Member B's checkout automation.
Validates that user_confirmed=True, then calls the Playwright checkout module.

In production this delegates to checkout/executor.py (Member B).
"""
from state import AgentState


def execute_purchase_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("execute_purchase")

    confirmation = state.get("purchase_confirmation", {})
    if not confirmation.get("user_confirmed"):
        state["status"] = "failed"
        state["errors"].append({
            "category": "fatal",
            "node": "execute_purchase",
            "message": "execute_purchase called without confirmed purchase payload.",
        })
        return state

    state["status"] = "executing"

    # ── STUB: simulate a successful dry-run ──────────────────────────────────
    # Replace with real call once Member B's checkout/executor.py is available:
    #
    # from checkout.executor import run_checkout
    # result = await run_checkout(confirmation, dry_run=False)
    # if result["success"]:
    #     state["purchase_confirmation"]["order_id"] = result["order_id"]
    #     state["purchase_confirmation"]["confirmation_screenshot"] = result["screenshot_path"]
    #     state["status"] = "completed"
    # else:
    #     state["errors"].append({...})
    #     state["status"] = "failed"

    # Mock success
    import uuid
    state["purchase_confirmation"]["order_id"] = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
    state["purchase_confirmation"]["status"] = "order_placed"
    state["purchase_confirmation"]["confirmation_screenshot"] = None  # no screenshot in mock
    state["status"] = "completed"

    state["llm_response"] = (
        f"Your order has been placed! 🎉\n"
        f"Order ID: {state['purchase_confirmation']['order_id']}\n"
        f"Estimated delivery: {state['purchase_confirmation']['delivery']['estimated_date']}"
    )
    return state
