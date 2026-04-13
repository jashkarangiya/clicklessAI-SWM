"""
Walmart search scraper — curl_cffi Chrome TLS impersonation.

Walmart embeds all product data as JSON inside a <script id="__NEXT_DATA__"> tag
on the search results page.  We parse that JSON directly instead of fighting
with CSS selectors on a React-rendered DOM.

No Playwright / browser automation needed.
"""

from __future__ import annotations

import json
import logging
import random
import re
import time
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup
from curl_cffi import requests as cf_requests

logger = logging.getLogger(__name__)

_IMPERSONATE = ["chrome124", "chrome123", "chrome120", "chrome119"]

_UA_POOL = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

_HEADERS = {
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,image/apng,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "max-age=0",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
}


# ── helpers ──────────────────────────────────────────────────────────────────

def _parse_price(val: Any) -> Optional[float]:
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        m = re.search(r"[\d,]+\.?\d*", val.replace(",", ""))
        return float(m.group()) if m else None
    return None


def _item_to_product(item: Dict) -> Optional[Dict]:
    """Map a Walmart __NEXT_DATA__ product item to our normalized schema."""
    try:
        name = item.get("name") or item.get("title")
        if not name:
            return None

        price_info = item.get("priceInfo") or {}
        current_price = _parse_price(
            price_info.get("currentPrice", {}).get("price")
            or price_info.get("linePrice")
            or item.get("price")
        )
        original_price = _parse_price(
            price_info.get("wasPrice", {}).get("price")
            or price_info.get("listPrice")
        )

        rating_val = item.get("averageRating") or item.get("rating")
        rating = float(rating_val) if rating_val else None

        review_count = int(item.get("numberOfReviews") or item.get("reviewCount") or 0)

        # Image — try thumbnail list first, then primary
        images = item.get("imageInfo") or {}
        image_url = (
            (images.get("thumbnails") or [{}])[0].get("url")
            or images.get("thumbnailUrl")
            or item.get("image")
        )

        # Product URL
        canonical = item.get("canonicalUrl") or item.get("productPageUrl") or ""
        product_url = (
            f"https://www.walmart.com{canonical}"
            if canonical.startswith("/")
            else canonical or None
        )

        fulfillment = item.get("fulfillmentBadgeGroups") or []
        walmart_plus = any(
            "plus" in str(b).lower() for b in fulfillment
        )

        available = item.get("availabilityStatusDisplayValue") or ""
        in_stock = "out of stock" not in available.lower()

        return {
            "title": name.strip(),
            "price": current_price,
            "original_price": original_price,
            "currency": "USD",
            "rating": rating,
            "review_count": review_count,
            "image_url": image_url,
            "product_url": product_url,
            "delivery_estimate": None,
            "prime": walmart_plus,
            "in_stock": in_stock,
            "sponsored": bool(item.get("isSponsoredFlag")),
            "site": "walmart",
            "source": "walmart",
        }
    except Exception as exc:
        logger.debug("Walmart item extraction error: %s", exc)
        return None


def _extract_from_next_data(html: str) -> List[Dict]:
    """Pull products from Walmart's __NEXT_DATA__ JSON blob."""
    soup = BeautifulSoup(html, "lxml")
    script = soup.find("script", {"id": "__NEXT_DATA__"})
    if not script:
        logger.warning("Walmart: __NEXT_DATA__ script tag not found")
        return []

    try:
        data = json.loads(script.string or "")
    except (json.JSONDecodeError, TypeError) as exc:
        logger.warning("Walmart: failed to parse __NEXT_DATA__: %s", exc)
        return []

    # Navigate the Next.js props tree to find the items array
    # Path: props.pageProps.initialData.searchResult.itemStacks[*].items[*]
    try:
        search_result = (
            data.get("props", {})
            .get("pageProps", {})
            .get("initialData", {})
            .get("searchResult", {})
        )
        stacks = search_result.get("itemStacks") or []
        items: List[Dict] = []
        for stack in stacks:
            for item in stack.get("items") or []:
                items.append(item)
        return items
    except Exception as exc:
        logger.debug("Walmart __NEXT_DATA__ traversal error: %s", exc)
        return []


# ── public API ────────────────────────────────────────────────────────────────

def search_walmart_http(
    query: str,
    max_results: int = 10,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
) -> List[Dict]:
    """
    Synchronous Walmart search.  Call from a ThreadPoolExecutor.

    Uses a curl_cffi Session to persist cookies across requests:
    1. Warm up the session by hitting walmart.com homepage
    2. Then hit the search URL with the same session (cookies intact)

    Returns list of normalized product dicts (same schema as Amazon scraper).
    """
    impersonate = random.choice(_IMPERSONATE)
    ua = random.choice(_UA_POOL)
    headers = {**_HEADERS, "User-Agent": ua}
    logger.info("Walmart HTTP search: '%s' (impersonate=%s)", query, impersonate)

    session = cf_requests.Session(impersonate=impersonate)

    # ── Step 1: warm-up request to the homepage to get cookies ───────────────
    try:
        session.get(
            "https://www.walmart.com/",
            headers=headers,
            timeout=20,
        )
        time.sleep(random.uniform(0.8, 1.5))
    except Exception as exc:
        logger.debug("Walmart HTTP warm-up failed (non-fatal): %s", exc)

    # ── Step 2: actual search request ────────────────────────────────────────
    search_url = f"https://www.walmart.com/search?q={query.replace(' ', '+')}"
    search_headers = {**headers, "Referer": "https://www.walmart.com/", "Sec-Fetch-Site": "same-origin"}
    try:
        resp = session.get(
            search_url,
            headers=search_headers,
            timeout=30,
        )
    except Exception as exc:
        logger.error("Walmart HTTP request failed: %s", exc)
        return []

    if resp.status_code != 200:
        logger.warning("Walmart HTTP status %s", resp.status_code)
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    title = (soup.title.string or "") if soup.title else ""
    logger.info("Walmart HTTP landed on: '%s'", title[:100])

    blocked_signals = ("robot or human", "access denied", "bot check", "automated access")
    if any(s in title.lower() for s in blocked_signals):
        logger.warning("Walmart HTTP: bot-block page — '%s'", title[:80])
        return []

    raw_items = _extract_from_next_data(resp.text)
    logger.info("Walmart HTTP: %d raw items in __NEXT_DATA__", len(raw_items))

    results: List[Dict] = []
    for item in raw_items:
        if len(results) >= max_results:
            break
        product = _item_to_product(item)
        if not product:
            continue
        if max_price and product.get("price") and product["price"] > max_price:
            continue
        if min_rating and product.get("rating") and product["rating"] < min_rating:
            continue
        results.append(product)

    logger.info("Walmart HTTP: returning %d products for '%s'", len(results), query)
    return results
