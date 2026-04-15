"""
intent_detection node — classifies user intent and extracts entities.
Interrupts when the message is ambiguous and a clarification is needed.
"""
from langgraph.types import interrupt

from state import AgentState, normalize_agent_state
from llm_client import chat_json
from prompts import intent_detection_prompt, intent_with_clarification_prompt


REQUIRED_CLARIFY_INTENTS = {"product_search", "refine_search", "browse"}


def intent_detection_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("intent_detection")
    normalize_agent_state(state)
    user_message = state["user_message"]
    conversation_history = state["conversation_history"]
    user_prefs = state["user_preferences"]

    # ── First LLM call: detect intent ────────────────────────────────────────
    messages = intent_detection_prompt(user_message, conversation_history, user_prefs)
    parsed = _safe_detect(messages)

    # ── Clarification if ambiguous ───────────────────────────────────────────
    if parsed.get("is_ambiguous"):
        ambiguity_reason = parsed.get("ambiguity_reason") or ""
        clarification = {
            "question": f"Could you clarify: {ambiguity_reason}?",
            "options": _default_options_for_ambiguity(parsed),
            "field_target": _field_from_ambiguity_reason(ambiguity_reason),
        }
        state["status"] = "needs_clarification"
        state["clarification"] = clarification

        # Pause and wait for user answer (resumes with the user's answer as a string)
        user_answer: str = interrupt(clarification)

        # Directly write the answer to the correct query field so validate_enrich
        # does not ask for the same field again.
        _apply_clarification_to_state(state, ambiguity_reason, user_answer)

        # Re-detect with the clarification context for any remaining entities
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
        out = chat_json(messages)
        if not isinstance(out, dict):
            return {"intent": "chat", "entities": {}, "is_ambiguous": False, "ambiguity_reason": ""}
        return out
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


def _field_from_ambiguity_reason(reason: str) -> str:
    """Map an ambiguity reason string to the query field it concerns."""
    reason_lower = reason.lower()
    if "category" in reason_lower:
        return "category"
    if "budget" in reason_lower or "price" in reason_lower:
        return "budget"
    if "brand" in reason_lower:
        return "brand_pref"
    return "category"  # safe default


def _apply_clarification_to_state(state: dict, ambiguity_reason: str, user_answer: str) -> None:
    """
    Write the user's clarification answer directly into state["query"]["parsed"]
    so that validate_enrich does not ask for the same field again.
    """
    field = _field_from_ambiguity_reason(ambiguity_reason)
    parsed_q = state["query"].setdefault("parsed", {})

    if field == "budget":
        answer_lower = user_answer.lower()
        if "under" in answer_lower and "50" in answer_lower:
            parsed_q["budget"] = "under_50"
        elif "50" in answer_lower and "100" in answer_lower:
            parsed_q["budget"] = "50_100"
        elif "100" in answer_lower and "200" in answer_lower:
            parsed_q["budget"] = "100_200"
        elif "no limit" in answer_lower:
            parsed_q["budget"] = "no_limit"
        else:
            parsed_q["budget"] = user_answer
    else:
        # For category, brand_pref, and any other field: store the answer directly
        parsed_q[field] = user_answer.lower()
