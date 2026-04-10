"""
intent_detection node — classifies user intent and extracts entities.
Interrupts when the message is ambiguous and a clarification is needed.
"""
from langgraph.types import interrupt

from state import AgentState
from llm_client import chat_json
from prompts import intent_detection_prompt, intent_with_clarification_prompt


REQUIRED_CLARIFY_INTENTS = {"product_search", "refine_search", "browse"}


def intent_detection_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("intent_detection")
    user_message = state["user_message"]
    conversation_history = state["conversation_history"]
    user_prefs = state["user_preferences"]

    # ── First LLM call: detect intent ────────────────────────────────────────
    messages = intent_detection_prompt(user_message, conversation_history, user_prefs)
    parsed = _safe_detect(messages)

    # ── Clarification if ambiguous ───────────────────────────────────────────
    if parsed.get("is_ambiguous"):
        clarification = {
            "question": f"Could you clarify: {parsed['ambiguity_reason']}?",
            "options": _default_options_for_ambiguity(parsed),
            "field_target": "query",
        }
        state["status"] = "needs_clarification"
        state["clarification"] = clarification

        # Pause and wait for user answer (resumes with the user's answer as a string)
        user_answer: str = interrupt(clarification)

        # Re-detect with the clarification context
        messages2 = intent_with_clarification_prompt(
            user_message, user_answer, conversation_history, user_prefs
        )
        parsed = _safe_detect(messages2)

    # ── Update state ─────────────────────────────────────────────────────────
    intent = parsed.get("intent", "chat")
    entities = parsed.get("entities", {})

    state["intent"] = intent
    state["status"] = "ready"
    state["clarification"] = None

    # Merge extracted entities into query.parsed
    q = state["query"]
    q["raw"] = user_message
    parsed_q = q.setdefault("parsed", {})
    parsed_q["category"] = entities.get("category") or parsed_q.get("category")
    parsed_q["budget"] = entities.get("budget") or parsed_q.get("budget")
    parsed_q["brand_pref"] = entities.get("brand_pref") or parsed_q.get("brand_pref")
    parsed_q["sort_by"] = entities.get("sort_by") or parsed_q.get("sort_by")
    attrs = parsed_q.setdefault("attributes", {})
    attrs.update(entities.get("attributes") or {})

    return state


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_detect(messages: list) -> dict:
    try:
        return chat_json(messages)
    except Exception as exc:
        return {"intent": "chat", "entities": {}, "is_ambiguous": False, "ambiguity_reason": str(exc)}


def _default_options_for_ambiguity(parsed: dict) -> list:
    """Suggest generic options based on what's ambiguous."""
    reason = (parsed.get("ambiguity_reason") or "").lower()
    if "category" in reason:
        return ["Electronics", "Clothing", "Home & Kitchen", "Books", "Other"]
    if "budget" in reason:
        return ["Under $50", "$50–$100", "$100–$200", "No limit"]
    if "type" in reason:
        return ["Over-ear", "On-ear", "Earbuds", "Other"]
    return []
