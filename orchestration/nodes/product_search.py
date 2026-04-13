"""
product_search node — dispatches parallel Playwright scrapes to Amazon and Walmart.

Install browsers:  playwright install chromium

Class / demo helpers (set in .env — not for production):
  CLICKLESS_SKIP_CAPTCHA_CHECK=1  — see scraper/browser/stealth.py (don’t abort on CAPTCHA)
  CLICKLESS_DEMO_PRODUCT_FIXTURES=1 — if live scrape returns no rows, fill from fixtures/products.json
"""
from __future__ import annotations

import asyncio
import concurrent.futures
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
load_dotenv()  # ensure CLICKLESS_* vars from .env reach os.getenv()

from state import AgentState, normalize_agent_state

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from scraper.scrapers.amazon_http import search_amazon_http  # noqa: E402

# ── Category → Amazon department mapping ─────────────────────────────────────
# Maps normalized category keywords to Amazon's &i= department param so searches
# land in the right vertical and suppress cross-category noise.
_CATEGORY_DEPT: list[tuple[frozenset[str], str]] = [
    (frozenset({"phone", "smartphone", "iphone", "android", "mobile", "cell phone", "cellphone"}), "wireless"),
    (frozenset({"laptop", "notebook", "chromebook", "ultrabook"}), "computers"),
    (frozenset({"tablet", "ipad"}), "computers"),
    (frozenset({"headphone", "headphones", "earphone", "earbuds", "earbud", "headset", "earpiece"}), "electronics"),
    (frozenset({"tv", "television", "monitor", "display"}), "electronics"),
    (frozenset({"camera", "dslr", "mirrorless"}), "photo"),
    (frozenset({"shoe", "shoes", "sneaker", "sneakers", "boot", "boots", "sandal"}), "shoes"),
    (frozenset({"shirt", "pants", "jacket", "dress", "clothing", "clothes", "apparel"}), "apparel"),
]

# Category → set of title-match terms (any one must appear in product title)
# Key = canonical category word;  value = acceptable title words
_CATEGORY_TITLE_TERMS: dict[str, frozenset[str]] = {
    "phone":       frozenset({"phone", "mobile", "smartphone"}),
    "smartphone":  frozenset({"phone", "mobile", "smartphone"}),
    "iphone":      frozenset({"iphone"}),
    "laptop":      frozenset({"laptop", "notebook", "chromebook"}),
    "tablet":      frozenset({"tablet", "ipad"}),
    "ipad":        frozenset({"ipad", "tablet"}),
    "headphone":   frozenset({"headphone", "earbud", "earphone", "headset", "earpiece"}),
    "headphones":  frozenset({"headphone", "earbud", "earphone", "headset"}),
    "earbuds":     frozenset({"earbud", "earphone", "headphone", "airpod"}),
    "tv":          frozenset({"tv", "television"}),
    "monitor":     frozenset({"monitor", "display"}),
    "camera":      frozenset({"camera", "cam"}),
    "watch":       frozenset({"watch"}),
    "smartwatch":  frozenset({"watch"}),
    "shoe":        frozenset({"shoe", "sneaker", "boot", "runner", "trainer"}),
    "shoes":       frozenset({"shoe", "sneaker", "boot", "runner", "trainer"}),
    "sneaker":     frozenset({"sneaker", "shoe", "trainer", "runner"}),
    "sneakers":    frozenset({"sneaker", "shoe", "trainer", "runner"}),
    "shirt":       frozenset({"shirt", "tee", "top", "polo"}),
    "laptop bag":  frozenset({"bag", "backpack", "sleeve", "case"}),
    "keyboard":    frozenset({"keyboard"}),
    "mouse":       frozenset({"mouse", "mice", "trackpad"}),
    "speaker":     frozenset({"speaker"}),
    "router":      frozenset({"router", "wi-fi", "wifi", "mesh"}),
    "printer":     frozenset({"printer"}),
    "vacuum":      frozenset({"vacuum", "cleaner", "roomba"}),
}

# Categories where "unlocked" should be appended to filter carrier-locked devices
_UNLOCKED_CATEGORIES = frozenset({
    "phone", "smartphone", "iphone", "android phone", "mobile phone",
    "cell phone", "cellphone", "mobile",
})


def _get_amazon_dept(category: str) -> str:
    cat = category.lower().strip()
    for keywords, dept in _CATEGORY_DEPT:
        if cat in keywords or any(kw in cat for kw in keywords):
            return dept
    return "electronics"


def _get_category_title_terms(category: str) -> frozenset[str]:
    """Return the set of title keywords that must appear for a product to match this category."""
    cat = category.lower().strip()
    # Direct lookup first
    if cat in _CATEGORY_TITLE_TERMS:
        return _CATEGORY_TITLE_TERMS[cat]
    # Partial match: check if any key is a substring of the category
    for key, terms in _CATEGORY_TITLE_TERMS.items():
        if key in cat or cat in key:
            return terms
    # Fall back: use individual words from the category itself
    words = frozenset(re.findall(r"[a-z]{3,}", cat))
    return words if words else frozenset()


def _passes_category_filter(product: dict[str, Any], title_terms: frozenset[str]) -> bool:
    """Product title must contain at least one of the required category terms."""
    if not title_terms:
        return True
    title = (product.get("name") or "").lower()
    return any(term in title for term in title_terms)


# ── Service-bundle junk filter ────────────────────────────────────────────────
_JUNK_TITLE_PATTERNS = re.compile(
    r"\b(?:"
    r"\d+\s*(?:gb|mb)\s*(?:data|plan|lte)"
    r"|talk\s*&?\s*text"
    r"|sim\s*card"
    r"|(?:prepaid|postpaid)\s*plan"
    r"|phone\s*plan"
    r"|unlimited\s*(?:talk|data|text)"
    r"|month(?:ly)?\s*(?:plan|service)"
    r"|\$\d+\s*/\s*mo"
    r")\b",
    re.IGNORECASE,
)


def _is_junk_product(product: dict[str, Any]) -> bool:
    title = (product.get("name") or "").lower()
    return bool(_JUNK_TITLE_PATTERNS.search(title))


# ── Brand filter ──────────────────────────────────────────────────────────────
# Common brand aliases: maps a canonical brand name to extra spellings/abbreviations.
_BRAND_ALIASES: dict[str, list[str]] = {
    "sony":         ["sony"],
    "apple":        ["apple", "iphone", "ipad", "macbook", "airpods"],
    "samsung":      ["samsung", "galaxy"],
    "lg":           ["lg"],
    "bose":         ["bose"],
    "jbl":          ["jbl"],
    "microsoft":    ["microsoft", "surface", "xbox"],
    "google":       ["google", "pixel", "nest"],
    "amazon":       ["amazon", "echo", "kindle", "fire tv"],
    "anker":        ["anker", "soundcore"],
}


def _matches_brand(product: dict[str, Any], brand_pref: str) -> bool:
    """
    Return True when the product is clearly from *brand_pref*.

    Strategy (strict → looser, short-circuit):
    1. Exact match on the `brand` field (case-insensitive).
    2. Word-boundary match of the brand name (or any alias) in the product title.
       Word-boundary prevents "son" from matching "Sony" or "Samsung".
    """
    brand_lower = brand_pref.strip().lower()
    if not brand_lower:
        return True

    # 1. Check dedicated brand field first (most reliable)
    product_brand = (product.get("brand") or "").strip().lower()
    if product_brand and product_brand == brand_lower:
        return True

    # 2. Build set of terms to search for (canonical + aliases)
    search_terms = set(_BRAND_ALIASES.get(brand_lower, [brand_lower]))

    title = (product.get("name") or product.get("title") or "").lower()

    for term in search_terms:
        # Use word-boundary regex for single-word terms; substring for multi-word
        if " " in term:
            if term in title:
                return True
        else:
            if re.search(rf"\b{re.escape(term)}\b", title):
                return True

    return False


# Categories that are too generic to use as a standalone search query.
# When the only "query" we can build is one of these words, we fall back to
# the raw user message which is always more specific.
_GENERIC_CATEGORIES = frozenset({
    "electronics", "other", "product", "item", "thing", "stuff",
    "goods", "merchandise", "gadget", "gadgets",
})


def _build_search_query(parsed: dict[str, Any], user_message: str) -> str:
    """
    Compose a retailer search string: brand + category + attributes.
    Appends 'unlocked' for phone categories to suppress carrier bundles.

    Falls back to the raw user message when the extracted entities are too
    generic to produce a useful query (e.g. category="electronics" with no
    brand or attributes — happens often for comparison queries).
    """
    parts: list[str] = []
    if parsed.get("brand_pref"):
        parts.append(str(parsed["brand_pref"]))
    category = (parsed.get("category") or "").strip()
    if category:
        parts.append(category)
    for v in (parsed.get("attributes") or {}).values():
        if v and str(v).lower() not in ("comparison", "compare"):
            parts.append(str(v))
    if category.lower() in _UNLOCKED_CATEGORIES:
        parts.append("unlocked")
    q = " ".join(parts).strip()

    # If the only thing we built is a generic category word, the raw user
    # message is a much better search query (e.g. "compare iphone 17 and
    # samsung galaxy s21" → Amazon search for the exact model names).
    if not q or q.lower() in _GENERIC_CATEGORIES:
        return (user_message or "").strip()
    return q


_BUDGET_MAX_PRICE = {
    "under_50": 50.0,
    "50_100": 100.0,
    "100_200": 200.0,
    "mid_range": 200.0,
    "high_end": 10_000.0,
    "no_limit": None,
}


def _budget_to_max_price(budget: str | None) -> float | None:
    if not budget:
        return None
    key = budget.lower().replace("-", "_").replace("$", "")
    return _BUDGET_MAX_PRICE.get(key)


def _extract_amazon_asin(url: str | None) -> str:
    if not url:
        return ""
    from urllib.parse import unquote
    m = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", url, re.I)
    if not m:
        m = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", unquote(url), re.I)
    return m.group(1).upper() if m else ""


def _scraper_row_to_product(row: dict[str, Any], idx: int) -> dict[str, Any]:
    """
    Map scraper flat dict (title, price, rating, …) to the envelope shape
    expected by normalize_rank / scoring (pricing.current_price, ratings.stars, …).
    """
    src = (row.get("source") or row.get("site") or "other").lower()
    if src not in ("amazon", "walmart"):
        src = "other"
    url = row.get("product_url") or ""
    asin = ""
    if src == "amazon":
        asin = _extract_amazon_asin(url)
        product_id = f"amazon-{asin}" if asin else f"amazon-{idx}"
    elif src == "walmart":
        product_id = f"walmart-{idx}"
    else:
        product_id = f"other-{idx}"

    price = row.get("price")
    name = (row.get("title") or "Unknown product").strip()

    return {
        "product_id": product_id,
        "source": src,
        "source_url": url or None,
        "source_product_id": asin or None,
        "name": name,
        "brand": None,
        "category": "",
        "pricing": {
            "current_price": float(price) if price is not None else 0.0,
            "original_price": row.get("original_price"),
            "currency": row.get("currency") or "USD",
            "on_sale": bool(row.get("original_price") and price is not None),
        },
        "ratings": {
            "stars": row.get("rating"),
            "review_count": int(row.get("review_count") or 0),
        },
        "delivery": {
            "estimated_date": None,
            "shipping_cost": 0.0,
            "prime_eligible": bool(row.get("prime")),
            "in_stock": row.get("in_stock", True),
        },
        "attributes": {},
        "images": {"primary": row.get("image_url"), "thumbnails": []},
        "scoring": None,
        "scraper_meta": {k: row[k] for k in ("sponsored", "error") if k in row},
    }


def _fixture_row_to_scraper_shape(fx: dict[str, Any]) -> dict[str, Any]:
    """Map fixtures/products.json row to the flat dict _scraper_row_to_product expects."""
    pricing = fx.get("pricing") or {}
    ratings = fx.get("ratings") or {}
    imgs = fx.get("images") or {}
    primary = imgs.get("primary") if isinstance(imgs, dict) else None
    return {
        "title": fx.get("name"),
        "price": pricing.get("current_price"),
        "original_price": pricing.get("original_price"),
        "currency": pricing.get("currency") or "USD",
        "rating": ratings.get("stars"),
        "review_count": ratings.get("review_count", 0),
        "image_url": primary,
        "product_url": fx.get("source_url"),
        "prime": (fx.get("delivery") or {}).get("prime_eligible"),
        "in_stock": (fx.get("delivery") or {}).get("in_stock", True),
        "source": fx.get("source") or "amazon",
    }


_FIXTURES_PATH = Path(__file__).parent.parent / "fixtures" / "products.json"

_DEMO_STOP = frozenset({
    "the", "and", "for", "you", "are", "with", "that", "this", "from", "has", "have",
    "want", "give", "get", "compare", "top", "best", "some", "any", "can", "please", "show",
})


def _demo_fixtures_from_query(user_message: str, category: str) -> list:
    """Load fixtures/products.json and rank by keyword overlap (class demo fallback only)."""
    if not _FIXTURES_PATH.exists():
        return []
    try:
        all_rows = json.loads(_FIXTURES_PATH.read_text())
    except Exception:
        return []
    blob = f"{user_message} {category}".lower()
    words = set(re.findall(r"[a-z]{3,}", blob)) - _DEMO_STOP
    if not words:
        return list(all_rows)[:10]
    scored: list[tuple[int, dict]] = []
    for p in all_rows:
        hay = f"{p.get('name', '')} {p.get('category', '')}".lower()
        score = sum(1 for w in words if w in hay)
        if score:
            scored.append((score, p))
    scored.sort(key=lambda x: -x[0])
    if scored:
        return [p for _, p in scored[:12]]
    return list(all_rows)[:10]


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
    return [
        p
        for p in products
        if lo <= (p.get("pricing", {}).get("current_price") or 0) <= hi
    ]


def _run_http_scraper(scraper_fn, query: str, max_results: int, max_price, department: str):
    """
    Thin wrapper so synchronous HTTP scrapers (curl_cffi based) can be dispatched
    via run_in_executor without any event-loop concerns.
    """
    return scraper_fn(query, max_results=max_results, max_price=max_price, department=department)


async def product_search_node(state: AgentState) -> AgentState:
    import logging as _logging
    _log = _logging.getLogger(__name__)

    state["metadata"]["nodes_visited"].append("product_search")
    state["status"] = "executing"
    normalize_agent_state(state)

    parsed = state["query"]["parsed"]
    user_message = state.get("user_message") or ""
    category = (parsed.get("category") or "").strip()
    search_q = _build_search_query(parsed, user_message)
    max_price = _budget_to_max_price(parsed.get("budget"))
    budget = parsed.get("budget")

    # Derive Amazon department and category title terms from the extracted category
    department = _get_amazon_dept(category)
    title_terms = _get_category_title_terms(category)
    _log.info("[product_search] query=%r dept=%s title_terms=%s", search_q, department, title_terms)

    products: list = []

    try:
        loop = asyncio.get_running_loop()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            amazon_fut = loop.run_in_executor(
                pool, _run_http_scraper, search_amazon_http, search_q, 15, max_price, department
            )
            results = await asyncio.gather(amazon_fut, return_exceptions=True)

        for r in results:
            if isinstance(r, Exception):
                _log.error("[product_search] amazon scraper exception: %r", r)
                state["errors"].append({"category": "retryable", "message": str(r)})
                continue
            _log.info("[product_search] amazon returned %d rows", len(r))
            base = len(products)
            for j, row in enumerate(r):
                products.append(_scraper_row_to_product(row, base + j))
    except Exception as exc:
        state["errors"].append({"category": "retryable", "message": str(exc)})

    if budget and products:
        products = _filter_by_budget(products, budget)

    if (
        not products
        and os.getenv("CLICKLESS_DEMO_PRODUCT_FIXTURES", "").lower() in ("1", "true", "yes")
    ):
        demo_raw = _demo_fixtures_from_query(user_message, category)
        for k, row in enumerate(demo_raw):
            products.append(_scraper_row_to_product(_fixture_row_to_scraper_shape(row), k))
        state["errors"].append({
            "category": "info",
            "message": "CLICKLESS_DEMO_PRODUCT_FIXTURES: using bundled JSON (live scrape empty).",
        })

    # ── Post-processing filters ───────────────────────────────────────────────
    # 1. Drop CAPTCHA sentinels and service-bundle junk (carrier plans, SIM cards)
    products = [
        p for p in products
        if isinstance(p, dict)
        and (p.get("scraper_meta") or {}).get("error") != "captcha_required"
        and not _is_junk_product(p)
    ]

    # 2. Category filter: product title must contain a word matching the requested type
    #    e.g. "iphone" search → drop earbuds/chargers that also say "Apple" in title
    if title_terms:
        cat_filtered = [p for p in products if _passes_category_filter(p, title_terms)]
        if cat_filtered:  # only apply when we still have results
            products = cat_filtered
            _log.info("[product_search] after category filter: %d products", len(products))

    # 3. Brand filter: if brand was requested, title must mention the brand (or alias)
    brand_pref = parsed.get("brand_pref", "")
    if brand_pref and products:
        branded = [p for p in products if _matches_brand(p, brand_pref)]
        if branded:
            products = branded
            _log.info("[product_search] after brand filter: %d products", len(products))

    state["products"] = products
    # Always "completed" here: empty shelves are not a graph failure. If we use "failed",
    # route_after_product_search sends the run to error_recovery with no error category,
    # which surfaces as a generic fatal message. normalize_rank + present_results handle [].
    state["status"] = "completed"
    state["metadata"]["scrape_results_count"] = {
        "amazon": len(products),
    }
    return state
