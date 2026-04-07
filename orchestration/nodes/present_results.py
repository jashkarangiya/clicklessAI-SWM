"""
present_results node — generates LLM comparison text then waits (interrupt)
for the user to select a product, refine, or exit.
"""
from langgraph.types import interrupt

from state import AgentState
from llm_client import chat
from prompts import comparison_generation_prompt
from scoring import get_comparison_highlights

MAX_DISPLAYED = 5


def present_results_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("present_results")

    products = state.get("products", [])[:MAX_DISPLAYED]
    if not products:
        state["llm_response"] = "I couldn't find any products matching your request. Want to try different criteria?"
        state["present_action"] = "exit"
        return state

    # ── Generate natural-language comparison via LLM ──────────────────────────
    try:
        messages = comparison_generation_prompt(products, state["user_preferences"])
        comparison_text = chat(messages)
    except Exception as exc:
        comparison_text = f"Here are the top results I found. (LLM error: {exc})"

    highlights = get_comparison_highlights(products)

    # ── Build interrupt payload for the frontend (Member D) ───────────────────
    interrupt_payload = {
        "type": "product_selection",
        "products": products,
        "llm_comparison": comparison_text,
        "highlights": highlights,
    }
    state["llm_response"] = comparison_text

    # ── Wait for user action ──────────────────────────────────────────────────
    # Expected resume value:
    #   {"action": "select", "product_index": <int>}
    #   {"action": "refine", "refinement_text": "<string>"}
    #   {"action": "exit"}
    user_action: dict = interrupt(interrupt_payload)

    action = user_action.get("action", "exit")
    state["present_action"] = action

    if action == "select":
        idx = int(user_action.get("product_index", 0))
        state["selected_product"] = products[min(idx, len(products) - 1)]

    elif action == "refine":
        refinement = user_action.get("refinement_text", "")
        # Merge refinement into query so validate_enrich can handle it
        state["query"]["raw"] = refinement or state["query"]["raw"]
        state["user_message"] = refinement or state["user_message"]
        state["intent"] = "refine_search"
        state["status"] = "ready"
        # Reset products so a fresh search runs
        state["products"] = []

    elif action == "exit":
        state["status"] = "completed"

    return state
