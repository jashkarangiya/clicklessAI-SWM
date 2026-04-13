"""
normalize_rank node — scores all scraped products and returns a ranked list.
Uses scoring.py; pure Python, no LLM calls.
"""
from state import AgentState, normalize_agent_state
from scoring import rank_products
from mock_api import get_scoring_weights


def normalize_rank_node(state: AgentState) -> AgentState:
    normalize_agent_state(state)
    state["metadata"]["nodes_visited"].append("normalize_rank")

    products = state.get("products", [])
    if not products:
        state["status"] = "completed"
        return state

    user_prefs = state["user_preferences"]
    weights = get_scoring_weights(state["user_id"])

    ranked = rank_products(products, user_prefs, weights)
    state["products"] = ranked
    state["status"] = "completed"
    return state
