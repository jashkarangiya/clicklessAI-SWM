"""
error_recovery node — categorizes failures and routes to the appropriate recovery action.

Error categories:
  retryable        → network timeout, temporary failure  (retry same node, max 3 times)
  session_expired  → login required
  data_mismatch    → price/stock change
  site_blocked     → CAPTCHA / IP block
  fatal            → payment declined, unknown state
"""
from state import AgentState

MAX_RETRIES = 3


def error_recovery_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("error_recovery")

    errors = state.get("errors", [])
    last_error = errors[-1] if errors else {}
    category = last_error.get("category", "fatal")

    retry_count = state.get("metadata", {}).get("retry_count", 0)

    if category == "retryable" and retry_count < MAX_RETRIES:
        state["metadata"]["retry_count"] = retry_count + 1
        state["status"] = "ready"
        # retry_node tells the router which node to go back to
        failed_node = last_error.get("node", "product_search")
        state["retry_node"] = failed_node
        state["llm_response"] = f"Retrying ({retry_count + 1}/{MAX_RETRIES})…"

    elif category == "session_expired":
        state["status"] = "failed"
        state["retry_node"] = None
        state["llm_response"] = (
            "Your session on the retailer site has expired. "
            "Please reconnect your account in Settings and try again."
        )

    elif category == "data_mismatch":
        state["status"] = "failed"
        state["retry_node"] = None
        msg = last_error.get("message", "Product details changed since your last search.")
        state["llm_response"] = f"{msg} Would you like me to search again?"

    elif category == "site_blocked":
        state["status"] = "failed"
        state["retry_node"] = None
        state["llm_response"] = (
            "The retailer site is temporarily blocking automated access. "
            "Please try again in a few minutes."
        )

    else:  # fatal
        state["status"] = "failed"
        state["retry_node"] = None
        msg = last_error.get("message", "An unexpected error occurred.")
        state["llm_response"] = f"Sorry, something went wrong: {msg}"

    return state
