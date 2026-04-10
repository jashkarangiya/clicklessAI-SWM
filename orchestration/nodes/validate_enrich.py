"""
validate_enrich node — checks required fields per intent and auto-fills or asks.

Required fields per intent:
  product_search  →  category
  purchase        →  product_id, delivery_address, payment_method
  refine_search   →  original_query, refinement_criteria

Auto-fill rule: if preference store has the field with confidence > 0.7 → auto-fill.
Max 3 clarification questions per turn.
"""
from langgraph.types import interrupt

from state import AgentState
from llm_client import chat_json
from prompts import clarification_question_prompt
from mock_api import get_user_preferences

CONFIDENCE_THRESHOLD = 0.70
MAX_CLARIFICATIONS = 3

REQUIRED_FIELDS: dict[str, list[str]] = {
    "product_search": ["category"],
    "refine_search": [],       # refinement is inferred from user message
    "purchase": ["product_id", "delivery_address", "payment_method"],
    "browse": [],
    "pref_update": [],
    "chat": [],
}

# Nice-to-have fields: always try to auto-fill from preferences, no clarification asked
NICE_TO_HAVE_FIELDS: dict[str, list[str]] = {
    "product_search": ["budget", "brand_pref", "sort_by"],
    "refine_search": ["budget", "sort_by"],
    "purchase": [],
    "browse": [],
    "pref_update": [],
    "chat": [],
}

# Preference store keys that can auto-fill query fields
PREF_AUTOFILL_MAP: dict[str, tuple[str, str]] = {
    # field_name → (prefs_section, prefs_key)
    "budget": ("explicit", "budget_default"),
    "brand_pref": ("explicit", "preferred_brands"),
    "sort_by": ("implicit", "sort_tendency"),
    "delivery_address": ("explicit", "default_address"),
    "payment_method": ("explicit", "default_payment"),
}


def validate_enrich_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("validate_enrich")
    intent = state["intent"]

    # Load fresh preferences
    prefs = get_user_preferences(state["user_id"])
    state["user_preferences"] = prefs

    required = REQUIRED_FIELDS.get(intent, [])
    optional = NICE_TO_HAVE_FIELDS.get(intent, [])
    missing = _find_missing_fields(state, required)

    # ── Auto-fill nice-to-have fields from preferences (always, no clarification) ──
    for field in optional:
        if not state["query"]["parsed"].get(field):
            _try_autofill(state, field, prefs)

    # ── Auto-fill from preferences (high-confidence fields) ──────────────────
    still_missing = []
    for field in missing:
        if _try_autofill(state, field, prefs):
            pass  # filled
        else:
            still_missing.append(field)

    # ── Clarification loop (max 3 questions) ─────────────────────────────────
    for field in still_missing:
        if state["clarification_count"] >= MAX_CLARIFICATIONS:
            # Apply best-effort defaults and surface assumptions
            _apply_default(state, field)
            continue

        clarification = _generate_clarification(field, state)
        state["clarification"] = clarification
        state["status"] = "needs_clarification"

        user_answer: str = interrupt(clarification)
        state["clarification_count"] = state.get("clarification_count", 0) + 1

        _apply_user_answer(state, field, user_answer)

    state["status"] = "ready"
    state["missing_fields"] = []
    state["clarification"] = None
    return state


# ── Helpers ───────────────────────────────────────────────────────────────────

def _find_missing_fields(state: AgentState, required: list) -> list:
    missing = []
    q = state["query"]["parsed"]
    for field in required:
        val = q.get(field) or state.get(field)
        if not val:
            missing.append(field)
    return missing


def _try_autofill(state: AgentState, field: str, prefs: dict) -> bool:
    """Returns True if the field was filled from preferences with enough confidence."""
    if field not in PREF_AUTOFILL_MAP:
        return False
    section, key = PREF_AUTOFILL_MAP[field]
    value = prefs.get(section, {}).get(key)
    if not value:
        return False
    # Simple confidence: explicit → 0.9, implicit → 0.6
    confidence = 0.90 if section == "explicit" else 0.60
    if confidence >= CONFIDENCE_THRESHOLD:
        state["query"]["parsed"][field] = value
        return True
    return False


def _generate_clarification(field: str, state: AgentState) -> dict:
    context = {
        "category": state["query"]["parsed"].get("category", "product"),
        "intent": state["intent"],
    }
    try:
        result = chat_json(clarification_question_prompt(field, context))
        return {
            "question": result.get("question", f"What is your preferred {field}?"),
            "options": result.get("options", []),
            "field_target": field,
        }
    except Exception:
        return {
            "question": f"What is your preferred {field.replace('_', ' ')}?",
            "options": [],
            "field_target": field,
        }


def _apply_user_answer(state: AgentState, field: str, answer: str) -> None:
    """Write the user's clarification answer back into the query."""
    parsed = state["query"]["parsed"]
    if field == "budget":
        # Try to normalize budget answer
        answer_lower = answer.lower()
        if "under" in answer_lower and "50" in answer_lower:
            parsed["budget"] = "under_50"
        elif "50" in answer_lower and "100" in answer_lower:
            parsed["budget"] = "50_100"
        elif "100" in answer_lower and "200" in answer_lower:
            parsed["budget"] = "100_200"
        elif "no limit" in answer_lower:
            parsed["budget"] = "no_limit"
        else:
            parsed["budget"] = answer
    elif field == "category":
        parsed["category"] = answer.lower()
    else:
        parsed[field] = answer


def _apply_default(state: AgentState, field: str) -> None:
    """Apply a safe default when max clarification depth is reached."""
    defaults = {
        "budget": "no_limit",
        "sort_by": "relevance",
        "delivery_address": None,
        "payment_method": None,
    }
    val = defaults.get(field)
    if val:
        state["query"]["parsed"][field] = val
