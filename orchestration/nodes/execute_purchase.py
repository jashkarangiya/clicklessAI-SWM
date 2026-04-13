"""
execute_purchase node — adds the confirmed product to the user's Amazon cart.

Reads amazon_cookies from state (injected by the WS handler from MongoDB).
Falls back to a mock dry-run if no cookies are available (e.g. account not connected).
"""
import logging
import re
import sys
from pathlib import Path

from state import AgentState

logger = logging.getLogger(__name__)

# Ensure the repo root is in path so scraper package is importable
_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))


def _extract_asin(product_url: str) -> str | None:
    """Extract ASIN from an Amazon product URL."""
    if not product_url:
        return None
    match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", product_url)
    return match.group(1) if match else None


def execute_purchase_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("execute_purchase")

    confirmation = state.get("purchase_confirmation") or {}
    if not confirmation.get("user_confirmed"):
        state["status"] = "failed"
        state["errors"].append({
            "category": "fatal",
            "node": "execute_purchase",
            "message": "execute_purchase called without confirmed purchase payload.",
        })
        return state

    state["status"] = "executing"

    # ── Get the ASIN of the selected product ────────────────────────────────
    product = state.get("selected_product") or {}
    product_url = product.get("product_url", "")
    asin = _extract_asin(product_url)

    if not asin:
        # Some product URLs may not follow /dp/{ASIN} — fall back to title-only message
        logger.warning("Could not extract ASIN from product_url=%s", product_url)

    # ── Try real add-to-cart if user has connected Amazon ────────────────────
    amazon_cookies: list = state.get("amazon_cookies") or []

    if asin and amazon_cookies:
        try:
            from scraper.scrapers.amazon_cart import add_to_cart_http
            result = add_to_cart_http(asin, amazon_cookies)

            if result.get("success"):
                state["purchase_confirmation"]["status"] = "added_to_cart"
                state["purchase_confirmation"]["cart_url"] = result.get("cart_url", "https://www.amazon.com/gp/cart/view.html")
                state["status"] = "completed"
                state["llm_response"] = (
                    f"Done! **{product.get('title', 'The product')}** has been added to your Amazon cart.\n\n"
                    f"[View your cart]({result['cart_url']}) to review and complete checkout."
                )
                return state
            else:
                # Session expired or other error — fall through to error message
                error_msg = result.get("message", "Unknown error")
                logger.warning("add_to_cart_http failed: %s", error_msg)
                state["status"] = "failed"
                state["errors"].append({
                    "category": "recoverable",
                    "node": "execute_purchase",
                    "message": error_msg,
                })
                state["llm_response"] = f"I couldn't add the product to your cart: {error_msg}"
                return state

        except Exception as exc:
            logger.exception("execute_purchase: add_to_cart_http raised an exception")
            state["status"] = "failed"
            state["errors"].append({
                "category": "recoverable",
                "node": "execute_purchase",
                "message": str(exc),
            })
            state["llm_response"] = "Something went wrong while adding the product to your cart. Please try again."
            return state

    # ── No Amazon session — prompt user to connect ───────────────────────────
    if not amazon_cookies:
        state["status"] = "failed"
        state["errors"].append({
            "category": "recoverable",
            "node": "execute_purchase",
            "message": "Amazon account not connected.",
        })
        state["llm_response"] = (
            "To add products to your Amazon cart, you need to connect your Amazon account first.\n\n"
            "Go to **Settings → Connections** and click **Connect Amazon Account**."
        )
        return state

    # ── ASIN missing but cookies present — open cart page as fallback ────────
    state["purchase_confirmation"]["status"] = "redirect_to_cart"
    state["purchase_confirmation"]["cart_url"] = f"https://www.amazon.com/dp/{asin or ''}" if asin else "https://www.amazon.com/gp/cart/view.html"
    state["status"] = "completed"
    state["llm_response"] = (
        f"I couldn't extract the product ID for direct cart addition. "
        f"[Open the product on Amazon]({product_url}) and add it manually."
    )
    return state
