"""
Walmart search + listing scraper with normalized product output.
Same interface as Amazon scraper - identical function signature and output schema.
Uses Playwright for browser automation with Walmart-specific DOM selectors.
"""

import re
import logging
from typing import List, Dict, Optional
from pathlib import Path

import yaml
from playwright.async_api import async_playwright, Page

from scraper.browser.stealth import (
    get_random_user_agent,
    apply_stealth_scripts,
    random_delay,
    detect_captcha,
    get_stealth_browser_args,
)

logger = logging.getLogger(__name__)

# Load selectors from YAML registry
_SELECTORS_PATH = Path(__file__).parent.parent / "selectors" / "walmart.yaml"
with open(_SELECTORS_PATH, "r") as f:
    SELECTORS = yaml.safe_load(f)


def _parse_price(text: Optional[str]) -> Optional[float]:
    """Extract a numeric price from text like '$29.99' or 'Now $29.99'."""
    if not text:
        return None
    match = re.search(r"\$?([\d,]+\.?\d*)", text.replace(",", ""))
    return float(match.group(1)) if match else None


def _parse_rating(text: Optional[str]) -> Optional[float]:
    """Extract rating from text like '4.5' or '(4.5)'."""
    if not text:
        return None
    match = re.search(r"([\d.]+)", text)
    val = float(match.group(1)) if match else None
    return val if val and val <= 5.0 else None


def _parse_review_count(text: Optional[str]) -> int:
    """Extract review count from text like '1234 reviews' or '(1,234)'."""
    if not text:
        return 0
    match = re.search(r"([\d,]+)", text.replace(",", ""))
    return int(match.group(1)) if match else 0


async def search_walmart(
    query: str,
    max_results: int = 10,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
) -> List[Dict]:
    """
    Search Walmart for products and return normalized product data.

    Args:
        query: Search query string.
        max_results: Maximum number of results to return (default 10).
        max_price: Optional price ceiling filter.
        min_rating: Optional minimum star rating filter.

    Returns:
        List of normalized product dicts (same schema as Amazon scraper).
    """
    products = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=get_stealth_browser_args(),
        )
        context = await browser.new_context(
            user_agent=get_random_user_agent(),
            viewport={"width": 1366, "height": 768},
            locale="en-US",
        )
        page = await context.new_page()
        await apply_stealth_scripts(page)

        try:
            products = await _scrape_search_results(
                page, query, max_results, max_price, min_rating
            )
        except Exception as e:
            logger.error(f"Walmart search failed: {e}")
        finally:
            await browser.close()

    return products


async def _scrape_search_results(
    page: Page,
    query: str,
    max_results: int,
    max_price: Optional[float],
    min_rating: Optional[float],
) -> List[Dict]:
    """Core scraping logic for Walmart search results."""
    products = []
    search_url = f"https://www.walmart.com/search?q={query.replace(' ', '+')}"

    logger.info(f"Navigating to Walmart search: {query}")
    await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
    await random_delay(2, 4)

    if await detect_captcha(page):
        logger.warning("CAPTCHA detected on Walmart - returning empty results")
        return [_captcha_error_product()]

    page_num = 1
    while len(products) < max_results:
        logger.info(f"Scraping Walmart page {page_num}...")
        sel = SELECTORS["search_results"]

        # Try primary container, fallback to alt
        items = await page.query_selector_all(sel["container"])
        if not items:
            items = await page.query_selector_all(sel["container_alt"])
        if not items:
            logger.warning("No search result items found on Walmart page")
            break

        for item in items:
            if len(products) >= max_results:
                break

            product = await _extract_product(item, sel)
            if not product:
                continue

            # Skip sponsored
            sponsored_el = await item.query_selector(sel["sponsored_label"])
            if sponsored_el:
                sponsored_text = await sponsored_el.inner_text()
                if "sponsored" in sponsored_text.lower():
                    product["sponsored"] = True

            # Apply filters
            if max_price and product.get("price") and product["price"] > max_price:
                continue
            if min_rating and product.get("rating") and product["rating"] < min_rating:
                continue

            products.append(product)

        # Pagination
        if len(products) < max_results:
            next_btn = await page.query_selector(SELECTORS["pagination"]["next_page"])
            if not next_btn:
                next_btn = await page.query_selector(SELECTORS["pagination"]["next_page_alt"])
            if next_btn:
                await next_btn.click()
                await random_delay(2, 4)
                page_num += 1
                if await detect_captcha(page):
                    break
            else:
                break

    logger.info(f"Walmart: scraped {len(products)} products for '{query}'")
    return products


async def _extract_product(item, sel: Dict) -> Optional[Dict]:
    """Extract a single product from a Walmart search result element."""
    try:
        # Title (try primary, then alt)
        title_el = await item.query_selector(sel["title"])
        if not title_el:
            title_el = await item.query_selector(sel["title_alt"])
        title = await title_el.inner_text() if title_el else None
        if not title:
            return None

        # Product URL
        link_el = await item.query_selector(sel["title_link"])
        if not link_el:
            link_el = await item.query_selector(sel["title_link_alt"])
        href = await link_el.get_attribute("href") if link_el else None
        product_url = f"https://www.walmart.com{href}" if href and href.startswith("/") else href

        # Price (try multiple selectors for Walmart's varying markup)
        price = None
        for price_sel in [sel["price_current"], sel["price_current_alt"]]:
            price_el = await item.query_selector(price_sel)
            if price_el:
                price_text = await price_el.inner_text()
                price = _parse_price(price_text)
                if price:
                    break

        # Original/rollback price
        original_price_el = await item.query_selector(sel["price_original"])
        original_price_text = await original_price_el.inner_text() if original_price_el else None
        original_price = _parse_price(original_price_text)

        # Rating
        rating_el = await item.query_selector(sel["rating"])
        if not rating_el:
            rating_el = await item.query_selector(sel["rating_alt"])
        rating_text = await rating_el.inner_text() if rating_el else None
        rating = _parse_rating(rating_text)

        # Review count
        review_el = await item.query_selector(sel["review_count"])
        review_text = await review_el.inner_text() if review_el else None
        review_count = _parse_review_count(review_text)

        # Image
        image_el = await item.query_selector(sel["image"])
        if not image_el:
            image_el = await item.query_selector(sel["image_alt"])
        image_url = await image_el.get_attribute("src") if image_el else None

        # Delivery / Walmart+ badge
        delivery_el = await item.query_selector(sel["delivery"])
        delivery_text = await delivery_el.inner_text() if delivery_el else None

        walmart_plus_el = await item.query_selector(sel["walmart_plus"])
        is_walmart_plus = walmart_plus_el is not None

        # Stock check
        stock_el = await item.query_selector(sel["out_of_stock"])
        stock_text = await stock_el.inner_text() if stock_el else ""
        in_stock = "out of stock" not in stock_text.lower()

        return {
            "title": title.strip() if title else "Unknown Product",
            "price": price,
            "original_price": original_price,
            "currency": "USD",
            "rating": rating,
            "review_count": review_count,
            "image_url": image_url,
            "product_url": product_url,
            "delivery_estimate": delivery_text,
            "prime": is_walmart_plus,  # Walmart+ equivalent of Prime
            "in_stock": in_stock,
            "sponsored": False,
            "site": "walmart",
            "source": "walmart",
        }

    except Exception as e:
        logger.debug(f"Failed to extract Walmart product: {e}")
        return None


def _captcha_error_product() -> Dict:
    """Return a placeholder indicating CAPTCHA was encountered."""
    return {
        "title": "[CAPTCHA] Walmart blocked automated access",
        "price": None,
        "original_price": None,
        "currency": "USD",
        "rating": None,
        "review_count": 0,
        "image_url": None,
        "product_url": None,
        "delivery_estimate": None,
        "prime": False,
        "in_stock": False,
        "sponsored": False,
        "site": "walmart",
        "source": "walmart",
        "error": "captcha_required",
    }
