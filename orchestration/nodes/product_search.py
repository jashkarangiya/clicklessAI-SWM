"""
product_search node — stub for Member B's Playwright scrapers.

In production this dispatches parallel scrape tasks to Amazon and Walmart.
During Member A's development it returns mock data from fixtures/products.json.
"""
import json
import uuid
from pathlib import Path

from state import AgentState

_FIXTURES_PATH = Path(__file__).parent.parent / "fixtures" / "products.json"
_mock_products: list | None = None


def product_search_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("product_search")
    state["status"] = "executing"

    query = state["query"]["parsed"]
    category = (query.get("category") or "").lower()
    budget = query.get("budget")
    brand_pref = query.get("brand_pref")

    products = _load_mock_products()

    # Simple filtering on mock data
    if category:
        products = [p for p in products if category in (p.get("category") or "").lower()]
    if budget:
        products = _filter_by_budget(products, budget)
    if brand_pref:
        brand_lower = brand_pref.lower()
        # Don't hard-filter by brand — just prefer them; ranking will handle it

    state["products"] = products if products else _load_mock_products()[:10]
    state["status"] = "completed"
    state["metadata"]["scrape_results_count"] = {
        "amazon": sum(1 for p in state["products"] if p.get("source") == "amazon"),
        "walmart": sum(1 for p in state["products"] if p.get("source") == "walmart"),
    }
    return state


def _load_mock_products() -> list:
    global _mock_products
    if _mock_products is None:
        _mock_products = json.loads(_FIXTURES_PATH.read_text()) if _FIXTURES_PATH.exists() else []
    return list(_mock_products)  # return a copy


def _filter_by_budget(products: list, budget: str) -> list:
    ranges = {
        "under_50": (0, 50),
        "50_100": (50, 100),
        "100_200": (100, 200),
        "mid_range": (50, 200),
        "high_end": (200, 10_000),
        "no_limit": (0, 10_000),
    }
    lo, hi = ranges.get(budget.lower().replace("-", "_").replace("$", ""), (0, 10_000))
    return [p for p in products if lo <= (p.get("pricing", {}).get("current_price") or 0) <= hi]


# ── Interface for Member B to replace ─────────────────────────────────────────
# Once Member B's scrapers are ready, replace this module's body with:
#
# from scrapers.amazon import scrape_amazon
# from scrapers.walmart import scrape_walmart
# import asyncio
#
# async def product_search_node(state):
#     results = await asyncio.gather(
#         scrape_amazon(state["query"]["parsed"], state["user_id"]),
#         scrape_walmart(state["query"]["parsed"], state["user_id"]),
#         return_exceptions=True
#     )
#     products = []
#     for r in results:
#         if isinstance(r, Exception):
#             state["errors"].append({"category": "retryable", "message": str(r)})
#         else:
#             products.extend(r)
#     state["products"] = products
#     state["status"] = "completed" if products else "failed"
#     return state
