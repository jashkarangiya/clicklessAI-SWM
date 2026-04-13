"""
Amazon search scraper — curl_cffi Chrome TLS impersonation.

Uses curl_cffi to make HTTP requests that match Chrome's exact TLS fingerprint
(JA3/JA4 hash, cipher suites, extensions order). Amazon's bot detection checks
TLS fingerprint and cannot distinguish this from a real browser.

No Playwright / browser automation needed for search results.
"""

from __future__ import annotations

import logging
import random
import re
import time
from typing import Dict, List, Optional

from bs4 import BeautifulSoup
from curl_cffi import requests as cf_requests

logger = logging.getLogger(__name__)

# Rotate across Chrome versions to avoid single-fingerprint blocklisting
_IMPERSONATE = ["chrome120", "chrome119", "chrome124", "chrome123"]

_UA_POOL = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

def _parse_price(text: Optional[str]) -> Optional[float]:
    if not text:
        return None
    m = re.search(r"[\d,]+\.?\d*", text.replace(",", ""))
    return float(m.group()) if m else None


def _parse_rating(text: Optional[str]) -> Optional[float]:
    if not text:
        return None
    m = re.search(r"([\d.]+)\s*out\s*of\s*5", text)
    return float(m.group(1)) if m else None


def _parse_review_count(text: Optional[str]) -> int:
    if not text:
        return 0
    clean = text.replace(",", "").strip("()")
    m = re.search(r"\d+", clean)
    return int(m.group()) if m else 0


def _extract(item) -> Optional[Dict]:
    try:
        title_el = item.select_one("h2 a span") or item.select_one("h2 span")
        title = title_el.get_text(strip=True) if title_el else None
        if not title:
            return None

        # Prefer a direct /dp/ link; fall back to any /dp/ link on the card;
        # last resort: first sspa/click link (ASIN is URL-encoded in its `url` param).
        link_el = (
            item.select_one("a.a-link-normal[href*='/dp/']")
            or item.select_one("a[href*='/dp/']")
            or item.select_one("a[href*='sspa/click']")
            or item.select_one("a[href^='/'][href]")
        )
        href = link_el.get("href") if link_el else None
        if href and href.startswith("/"):
            product_url = f"https://www.amazon.com{href}"
        else:
            product_url = href or None

        price_els = item.select("span.a-price span.a-offscreen")
        price = _parse_price(price_els[0].get_text() if price_els else None)
        original_price = _parse_price(price_els[1].get_text() if len(price_els) > 1 else None)

        rating_el = item.select_one("span.a-icon-alt")
        rating = _parse_rating(rating_el.get_text() if rating_el else None)

        review_el = item.select_one("span.a-size-base.s-underline-text")
        review_count = _parse_review_count(review_el.get_text() if review_el else None)

        img_el = item.select_one("img.s-image")
        image_url = img_el.get("src") if img_el else None

        prime = bool(item.select_one("i.a-icon-prime"))

        stock_el = item.select_one("span.a-color-price")
        in_stock = not (
            stock_el and "currently unavailable" in stock_el.get_text().lower()
        )

        return {
            "title": title,
            "price": price,
            "original_price": original_price,
            "currency": "USD",
            "rating": rating,
            "review_count": review_count,
            "image_url": image_url,
            "product_url": product_url,
            "delivery_estimate": None,
            "prime": prime,
            "in_stock": in_stock,
            "sponsored": False,
            "site": "amazon",
            "source": "amazon",
        }
    except Exception as exc:
        logger.debug("Amazon item extraction error: %s", exc)
        return None


# ── public API ────────────────────────────────────────────────────────────────

def search_amazon_http(
    query: str,
    max_results: int = 10,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    max_retries: int = 3,
    department: str = "electronics",
) -> List[Dict]:
    """
    Synchronous Amazon search.  Call from a ThreadPoolExecutor so it doesn't
    block the async event loop.

    Retries up to max_retries times on 503 / bot-block with exponential backoff
    and rotated impersonation profile + User-Agent on each attempt.

    Returns list of normalized product dicts (same schema as Playwright scraper).
    """
    encoded_q = query.replace(' ', '+')
    url = f"https://www.amazon.com/s?k={encoded_q}&i={department}"

    for attempt in range(max_retries):
        impersonate = random.choice(_IMPERSONATE)
        ua = random.choice(_UA_POOL)
        headers = {**_HEADERS, "User-Agent": ua}
        logger.info("Amazon HTTP search: '%s' attempt=%d (impersonate=%s)", query, attempt + 1, impersonate)

        try:
            resp = cf_requests.get(
                url,
                headers=headers,
                impersonate=impersonate,
                timeout=30,
            )
        except Exception as exc:
            logger.error("Amazon HTTP request failed (attempt %d): %s", attempt + 1, exc)
            if attempt < max_retries - 1:
                time.sleep(random.uniform(1.5, 3.0) * (attempt + 1))
            continue

        if resp.status_code == 503:
            logger.warning("Amazon HTTP 503 (attempt %d) — backing off", attempt + 1)
            if attempt < max_retries - 1:
                time.sleep(random.uniform(2.0, 4.0) * (attempt + 1))
            continue

        if resp.status_code != 200:
            logger.warning("Amazon HTTP status %s (attempt %d)", resp.status_code, attempt + 1)
            if attempt < max_retries - 1:
                time.sleep(random.uniform(1.0, 2.0))
            continue

        soup = BeautifulSoup(resp.text, "lxml")
        title = (soup.title.string or "") if soup.title else ""
        logger.info("Amazon HTTP landed on: '%s'", title[:100])

        blocked_signals = ("robot check", "access denied", "automated access", "before we continue")
        if any(s in title.lower() for s in blocked_signals):
            logger.warning("Amazon HTTP: bot-block page (attempt %d) — '%s'", attempt + 1, title[:80])
            if attempt < max_retries - 1:
                time.sleep(random.uniform(2.0, 4.0) * (attempt + 1))
            continue

        items = soup.select("div[data-component-type='s-search-result']")
        logger.info("Amazon HTTP: %d candidate items found", len(items))

        results: List[Dict] = []
        for item in items:
            if len(results) >= max_results:
                break
            product = _extract(item)
            if not product:
                continue
            if max_price and product.get("price") and product["price"] > max_price:
                continue
            if min_rating and product.get("rating") and product["rating"] < min_rating:
                continue
            results.append(product)

        logger.info("Amazon HTTP: returning %d products for '%s'", len(results), query)
        return results

    logger.error("Amazon HTTP: all %d attempts failed for '%s'", max_retries, query)
    return []
