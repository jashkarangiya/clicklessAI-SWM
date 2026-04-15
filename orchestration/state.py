from typing import TypedDict, Optional, List, Dict, Any


class AgentState(TypedDict):
    # ── Shared JSON envelope (all members consume/produce this) ──────────────
    session_id: str
    user_id: str
    turn_id: int
    timestamp: str
    intent: str          # product_search | purchase | refine | browse | pref_update | chat
    status: str          # needs_clarification | ready | executing | completed | failed
    query: Dict[str, Any]           # {raw, parsed: {category, attributes, budget, brand_pref, sort_by}}
    missing_fields: List[str]
    clarification: Optional[Dict[str, Any]]   # {question, options, field_target}
    products: List[Dict[str, Any]]            # normalized product objects
    selected_product: Optional[Dict[str, Any]]
    purchase_confirmation: Optional[Dict[str, Any]]
    preference_updates: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]
    metadata: Dict[str, Any]        # {nodes_visited, total_latency_ms, scrape_results_count}

    # ── Runtime fields (Member A internal, not passed to other members) ──────
    user_message: str
    conversation_history: List[Dict[str, Any]]   # [{role, content}]
    user_preferences: Dict[str, Any]             # loaded from mock_api / Member C
    clarification_count: int                     # max 3 per turn
    present_action: Optional[str]                # "select" | "refine" | "exit"
    llm_response: Optional[str]                  # for general_chat direct responses
    retry_node: Optional[str]                    # which node to retry on retryable errors
    amazon_cookies: List[Dict[str, Any]]         # session cookies captured from user's Amazon login


_DEFAULT_PARSED = {
    "category": None,
    "attributes": {},
    "budget": None,
    "brand_pref": None,
    "sort_by": None,
}


def normalize_query_parsed(state: AgentState) -> None:
    """
    Ensure query and query.parsed are dicts. LLM output or checkpoints may set
    parsed to null; dict.setdefault('parsed', {}) does not replace None.
    """
    q = state.get("query")
    if not isinstance(q, dict):
        state["query"] = {
            "raw": state.get("user_message") or "",
            "parsed": {**_DEFAULT_PARSED},
        }
        return
    p = q.get("parsed")
    if not isinstance(p, dict):
        q["parsed"] = {**_DEFAULT_PARSED}


def normalize_agent_state(state: AgentState) -> None:
    """
    LangGraph checkpoints may omit keys or set them to null. Nodes assume dict/list
    shapes (e.g. user_preferences.get, metadata['nodes_visited'].append).
    """
    normalize_query_parsed(state)

    if not isinstance(state.get("user_preferences"), dict):
        state["user_preferences"] = {}
    if not isinstance(state.get("conversation_history"), list):
        state["conversation_history"] = []
    if not isinstance(state.get("errors"), list):
        state["errors"] = []

    md = state.get("metadata")
    if not isinstance(md, dict):
        state["metadata"] = {
            "nodes_visited": [],
            "total_latency_ms": 0,
            "scrape_results_count": {"amazon": 0, "walmart": 0},
        }
    else:
        md.setdefault("nodes_visited", [])
        md.setdefault("total_latency_ms", 0)
        md.setdefault("scrape_results_count", {"amazon": 0, "walmart": 0})
        if not isinstance(md["nodes_visited"], list):
            md["nodes_visited"] = []
        scr = md.get("scrape_results_count")
        if not isinstance(scr, dict):
            md["scrape_results_count"] = {"amazon": 0, "walmart": 0}


def new_state(user_id: str, session_id: str, user_message: str) -> AgentState:
    """Create a fresh state envelope for a new conversation turn."""
    import uuid
    from datetime import datetime, timezone

    return AgentState(
        session_id=session_id,
        user_id=user_id,
        turn_id=1,
        timestamp=datetime.now(timezone.utc).isoformat(),
        intent="",
        status="ready",
        query={"raw": user_message, "parsed": {**_DEFAULT_PARSED}},
        missing_fields=[],
        clarification=None,
        products=[],
        selected_product=None,
        purchase_confirmation=None,
        preference_updates=[],
        errors=[],
        metadata={"nodes_visited": [], "total_latency_ms": 0, "scrape_results_count": {"amazon": 0, "walmart": 0}},
        user_message=user_message,
        conversation_history=[],
        user_preferences={},
        clarification_count=0,
        present_action=None,
        llm_response=None,
        retry_node=None,
        amazon_cookies=[],
    )
