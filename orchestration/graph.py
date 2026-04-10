"""
ClickLess AI — LangGraph state machine (Member A)

Entry:  intent_detection
Exit:   END  (after update_preferences or direct_chat)

All nodes use interrupt() for human-in-the-loop pauses.
Requires a checkpointer (MemorySaver for local dev, RedisCheckpointer in prod).
"""
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from state import AgentState
from nodes.intent_detection import intent_detection_node
from nodes.validate_enrich import validate_enrich_node
from nodes.product_search import product_search_node
from nodes.normalize_rank import normalize_rank_node
from nodes.present_results import present_results_node
from nodes.purchase_confirmation import purchase_confirmation_node
from nodes.execute_purchase import execute_purchase_node
from nodes.update_preferences import update_preferences_node
from nodes.error_recovery import error_recovery_node
from nodes.direct_chat import direct_chat_node


# ── Routing functions ─────────────────────────────────────────────────────────

def route_after_intent(state: AgentState) -> str:
    intent = state.get("intent", "chat")
    if intent == "chat":
        return "direct_chat"
    if intent == "pref_update":
        return "update_preferences"
    return "validate_enrich"


def route_after_validate(state: AgentState) -> str:
    intent = state.get("intent", "product_search")
    if intent == "purchase":
        return "purchase_confirmation"
    return "product_search"


def route_after_product_search(state: AgentState) -> str:
    if state.get("status") == "failed":
        return "error_recovery"
    return "normalize_rank"


def route_after_present_results(state: AgentState) -> str:
    action = state.get("present_action", "exit")
    if action == "select":
        return "purchase_confirmation"
    if action == "refine":
        return "validate_enrich"
    return "update_preferences"


def route_after_purchase_confirmation(state: AgentState) -> str:
    conf = state.get("purchase_confirmation") or {}
    if conf.get("user_confirmed"):
        return "execute_purchase"
    return "present_results"   # user cancelled → go back to results


def route_after_execute_purchase(state: AgentState) -> str:
    if state.get("status") == "failed":
        return "error_recovery"
    return "update_preferences"


def route_after_error_recovery(state: AgentState) -> str:
    retry_node = state.get("retry_node")
    if retry_node == "product_search":
        return "product_search"
    if retry_node == "execute_purchase":
        return "execute_purchase"
    return "update_preferences"


# ── Graph construction ────────────────────────────────────────────────────────

def build_graph(checkpointer=None) -> StateGraph:
    g = StateGraph(AgentState)

    # Register nodes
    g.add_node("intent_detection", intent_detection_node)
    g.add_node("validate_enrich", validate_enrich_node)
    g.add_node("product_search", product_search_node)
    g.add_node("normalize_rank", normalize_rank_node)
    g.add_node("present_results", present_results_node)
    g.add_node("purchase_confirmation", purchase_confirmation_node)
    g.add_node("execute_purchase", execute_purchase_node)
    g.add_node("update_preferences", update_preferences_node)
    g.add_node("error_recovery", error_recovery_node)
    g.add_node("direct_chat", direct_chat_node)

    # Entry point
    g.set_entry_point("intent_detection")

    # Edges
    g.add_conditional_edges(
        "intent_detection",
        route_after_intent,
        {"direct_chat": "direct_chat", "validate_enrich": "validate_enrich", "update_preferences": "update_preferences"},
    )
    g.add_edge("direct_chat", END)

    g.add_conditional_edges(
        "validate_enrich",
        route_after_validate,
        {"product_search": "product_search", "purchase_confirmation": "purchase_confirmation"},
    )

    g.add_conditional_edges(
        "product_search",
        route_after_product_search,
        {"normalize_rank": "normalize_rank", "error_recovery": "error_recovery"},
    )

    g.add_edge("normalize_rank", "present_results")

    g.add_conditional_edges(
        "present_results",
        route_after_present_results,
        {
            "purchase_confirmation": "purchase_confirmation",
            "validate_enrich": "validate_enrich",
            "update_preferences": "update_preferences",
        },
    )

    g.add_conditional_edges(
        "purchase_confirmation",
        route_after_purchase_confirmation,
        {"execute_purchase": "execute_purchase", "present_results": "present_results"},
    )

    g.add_conditional_edges(
        "execute_purchase",
        route_after_execute_purchase,
        {"update_preferences": "update_preferences", "error_recovery": "error_recovery"},
    )

    g.add_edge("update_preferences", END)

    g.add_conditional_edges(
        "error_recovery",
        route_after_error_recovery,
        {
            "product_search": "product_search",
            "execute_purchase": "execute_purchase",
            "update_preferences": "update_preferences",
        },
    )

    cp = checkpointer or MemorySaver()
    return g.compile(checkpointer=cp)


# Singleton app instance for use by Member C's FastAPI layer
app = build_graph()
