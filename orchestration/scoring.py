"""
Product scoring and ranking engine for ClickLess AI (Member A).

Scoring formula:
  composite = price_w * price_score
            + rating_w * rating_score
            + delivery_w * delivery_score
            + pref_w * preference_match_score
"""
from datetime import datetime, date, timezone
from typing import Any


DEFAULT_WEIGHTS = {
    "price": 0.30,
    "rating": 0.25,
    "delivery": 0.20,
    "preference_match": 0.25,
}

MAX_WEIGHT = 0.50   # no single weight can exceed this
EMA_ALPHA = 0.10    # exponential moving average smoothing


def _only_dict_products(products: list | None) -> list[dict]:
    """LangGraph / scrapers must not insert None into `products`, but guard anyway."""
    return [p for p in (products or []) if isinstance(p, dict)]


# ── Individual dimension scores ───────────────────────────────────────────────

def compute_price_score(product: dict, all_products: list) -> float:
    """Normalized inverse: cheapest product = 1.0, most expensive = 0.0."""
    safe = _only_dict_products(all_products)
    prices = [
        p["pricing"]["current_price"]
        for p in safe
        if p.get("pricing", {}).get("current_price") is not None
    ]
    if len(prices) <= 1:
        return 1.0
    lo, hi = min(prices), max(prices)
    if hi == lo:
        return 1.0
    price = product["pricing"]["current_price"]
    return round(1.0 - (price - lo) / (hi - lo), 4)


def compute_rating_score(product: dict, review_count_threshold: int = 100) -> float:
    """stars / 5.0 with a penalty when review_count is below threshold."""
    stars = product.get("ratings", {}).get("stars") or 0.0
    count = product.get("ratings", {}).get("review_count") or 0
    score = stars / 5.0
    if count < review_count_threshold and review_count_threshold > 0:
        deficit_ratio = 1.0 - count / review_count_threshold
        score -= 0.10 * deficit_ratio
    return round(max(0.0, min(1.0, score)), 4)


def compute_delivery_score(product: dict) -> float:
    """same-day = 1.0, 7+ days = 0.0; free / Prime shipping adds 0.1 bonus."""
    delivery = product.get("delivery", {})
    date_str = delivery.get("estimated_date")
    if not date_str:
        return 0.50
    try:
        est = datetime.strptime(date_str, "%Y-%m-%d").date()
        days = max(0, (est - date.today()).days)
        score = max(0.0, 1.0 - days / 7.0)
        if delivery.get("prime_eligible") or delivery.get("shipping_cost", 1) == 0:
            score = min(1.0, score + 0.10)
        return round(score, 4)
    except (ValueError, TypeError):
        return 0.50


def compute_preference_match_score(product: dict, user_prefs: dict) -> float:
    """Fraction of matching attributes; explicit prefs count double."""
    user_prefs = user_prefs if isinstance(user_prefs, dict) else {}
    explicit = user_prefs.get("explicit", {})
    score = 0.0
    total = 0

    product_brand = (product.get("brand") or "").lower()

    preferred_brands = [b.lower() for b in explicit.get("preferred_brands", [])]
    avoided_brands = [b.lower() for b in explicit.get("avoided_brands", [])]

    if preferred_brands:
        total += 2  # explicit → double weight
        if product_brand and product_brand in preferred_brands:
            score += 2

    if avoided_brands:
        total += 1
        if product_brand not in avoided_brands:
            score += 1

    # Budget compatibility
    budget_default = explicit.get("budget_default")
    if budget_default:
        total += 1
        price = product.get("pricing", {}).get("current_price") or 0
        if _price_within_budget(price, budget_default):
            score += 1

    # Site preference
    preferred_sites = [s.lower() for s in explicit.get("preferred_sites", [])]
    if preferred_sites:
        total += 1
        if (product.get("source") or "").lower() in preferred_sites:
            score += 1

    return round(score / total, 4) if total > 0 else 0.50


def _price_within_budget(price: float, budget_label: str) -> bool:
    mapping = {
        "under_50": (0, 50),
        "50_100": (50, 100),
        "100_200": (100, 200),
        "mid_range": (50, 200),
        "high_end": (200, 10_000),
        "no_limit": (0, 10_000),
    }
    lo, hi = mapping.get(budget_label.lower().replace("-", "_").replace("$", ""), (0, 10_000))
    return lo <= price <= hi


def _get_match_reasons(product: dict, user_prefs: dict) -> list[str]:
    user_prefs = user_prefs if isinstance(user_prefs, dict) else {}
    explicit = user_prefs.get("explicit", {})
    reasons = []
    brand = (product.get("brand") or "").lower()

    if brand and brand in [b.lower() for b in explicit.get("preferred_brands", [])]:
        reasons.append("matches brand preference")

    avg_price = user_prefs.get("implicit", {}).get("avg_purchase_price")
    price = product.get("pricing", {}).get("current_price") or 0
    if avg_price and price <= avg_price * 1.1:
        reasons.append("within budget")

    stars = product.get("ratings", {}).get("stars") or 0
    threshold = user_prefs.get("implicit", {}).get("rating_threshold", 4.0)
    if stars >= threshold:
        reasons.append("high ratings")

    if product.get("delivery", {}).get("prime_eligible"):
        reasons.append("Prime eligible")

    return reasons


# ── Composite scoring and ranking ─────────────────────────────────────────────

def score_product(product: dict, all_products: list, user_prefs: dict, weights: dict | None = None) -> float:
    """Compute composite score and attach `scoring` sub-dict to the product in-place."""
    if not isinstance(product, dict):
        return 0.0
    user_prefs = user_prefs if isinstance(user_prefs, dict) else {}
    w = {**DEFAULT_WEIGHTS, **(weights or {})}
    review_threshold = user_prefs.get("implicit", {}).get("review_count_threshold", 100)

    ps = compute_price_score(product, all_products)
    rs = compute_rating_score(product, review_threshold)
    ds = compute_delivery_score(product)
    pms = compute_preference_match_score(product, user_prefs)

    composite = (
        w["price"] * ps
        + w["rating"] * rs
        + w["delivery"] * ds
        + w["preference_match"] * pms
    )

    product["scoring"] = {
        "price_score": ps,
        "rating_score": rs,
        "delivery_score": ds,
        "preference_match_score": pms,
        "composite_score": round(composite, 4),
        "match_reasons": _get_match_reasons(product, user_prefs),
    }
    return composite


def rank_products(products: list, user_prefs: dict, weights: dict | None = None) -> list:
    """Score all products and return them sorted by composite_score descending."""
    user_prefs = user_prefs if isinstance(user_prefs, dict) else {}
    products = _only_dict_products(products)
    if not products:
        return []
    scored = [(score_product(p, products, user_prefs, weights), p) for p in products]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored]


# ── Comparison highlights (used by present_results) ──────────────────────────

def get_comparison_highlights(products: list) -> dict:
    """Return {cheapest, best_rated, fastest_delivery} product names."""
    products = _only_dict_products(products)
    if not products:
        return {}

    cheapest = min(products, key=lambda p: p.get("pricing", {}).get("current_price") or 9999)
    best_rated = max(products, key=lambda p: p.get("ratings", {}).get("stars") or 0)

    def delivery_days(p):
        d = p.get("delivery", {}).get("estimated_date")
        if not d:
            return 999
        try:
            return max(0, (datetime.strptime(d, "%Y-%m-%d").date() - date.today()).days)
        except Exception:
            return 999

    fastest = min(products, key=delivery_days)

    return {
        "cheapest": cheapest.get("name", ""),
        "best_rated": best_rated.get("name", ""),
        "fastest_delivery": fastest.get("name", ""),
    }


# ── Weight adaptation (EMA) ───────────────────────────────────────────────────

def adapt_weights(
    current_weights: dict,
    chosen_product: dict,
    all_products: list,
    alpha: float = EMA_ALPHA,
) -> dict:
    """
    Adjust scoring weights based on what the user chose.
    Uses exponential moving average so changes are gradual.
    """
    if not chosen_product or not all_products:
        return current_weights

    w = {**DEFAULT_WEIGHTS, **current_weights}
    all_products = _only_dict_products(all_products)

    # Detect if chosen product was cheapest / best-rated / fastest
    prices = [p.get("pricing", {}).get("current_price") or 9999 for p in all_products]
    ratings = [p.get("ratings", {}).get("stars") or 0 for p in all_products]

    chosen_price = chosen_product.get("pricing", {}).get("current_price") or 9999
    chosen_rating = chosen_product.get("ratings", {}).get("stars") or 0

    if chosen_price == min(prices):
        w["price"] = min(MAX_WEIGHT, w["price"] + alpha * (1.0 - w["price"]))
    if chosen_rating == max(ratings):
        w["rating"] = min(MAX_WEIGHT, w["rating"] + alpha * (1.0 - w["rating"]))

    # Normalize so weights sum to 1
    total = sum(w.values())
    return {k: round(v / total, 4) for k, v in w.items()}
