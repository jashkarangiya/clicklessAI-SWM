"""
Amazon search + listing scraper with normalized product output.
Standalone async function that takes a search query and returns
structured product data using Playwright for browser automation.
"""

import os
import re
import logging
import asyncio
from typing import List, Dict, Optional
from pathlib import Path

import yaml
from playwright.async_api import async_playwright, Page

from scraper.browser.stealth import (
    get_random_user_agent,
    apply_stealth_scripts,
    random_delay,
    detect_captcha,
    human_like_type,
    get_stealth_browser_args,
    playwright_headless,
)
from scraper.browser.captcha_resolve import resolve_or_continue

logger = logging.getLogger(__name__)

# Load selectors from YAML registry
_SELECTORS_PATH = Path(__file__).parent.parent / "selectors" / "amazon.yaml"
with open(_SELECTORS_PATH, "r") as f:
    SELECTORS = yaml.safe_load(f)


def _parse_price(text: Optional[str]) -> Optional[float]:
    """Extract a numeric price from text like '$29.99' or '$1,299.00'."""
    if not text:
        return None
    match = re.search(r"\$?([\d,]+\.?\d*)", text.replace(",", ""))
    return float(match.group(1)) if match else None


def _parse_rating(text: Optional[str]) -> Optional[float]:
    """Extract rating from text like '4.5 out of 5 stars'."""
    if not text:
        return None
    match = re.search(r"([\d.]+)\s*out\s*of\s*5", text)
    return float(match.group(1)) if match else None


def _parse_review_count(text: Optional[str]) -> int:
    """Extract review count from text like '1,234' or '1,234 ratings'."""
    if not text:
        return 0
    match = re.search(r"([\d,]+)", text.replace(",", ""))
    return int(match.group(1)) if match else 0


async def search_amazon(
    query: str,
    max_results: int = 10,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
) -> List[Dict]:
    """
    Search Amazon for products and return normalized product data.

    Args:
        query: Search query string.
        max_results: Maximum number of results to return (default 10).
        max_price: Optional price ceiling filter.
        min_rating: Optional minimum star rating filter.

    Returns:
        List of normalized product dicts.
    """
    products = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=playwright_headless(),
            args=get_stealth_browser_args(),
        )
        context = await browser.new_context(
            user_agent=get_random_user_agent(),
            viewport={"width": 1366, "height": 768},
            locale="en-US",
            timezone_id="America/Phoenix",
        )
        page = await context.new_page()
        await apply_stealth_scripts(page)

        try:
            products = await _scrape_search_results(
                page, query, max_results, max_price, min_rating
            )
        except Exception as e:
            logger.error(f"Amazon search failed: {e}", exc_info=True)
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
    """Core scraping logic: navigate, extract, paginate."""
    products = []
    search_url = f"https://www.amazon.com/s?k={query.replace(' ', '+')}"

    logger.info(f"Navigating to Amazon search: {query}")
    try:
        await page.goto(search_url, wait_until="domcontentloaded", timeout=45000)
    except Exception as nav_err:
        logger.error(f"Amazon navigation failed: {nav_err}")
        return []
    await random_delay(2, 4)

    page_title = await page.title()
    logger.info(f"Amazon landed on: '{page_title}' | {page.url}")

    # CAPTCHA / bot interstitial — try 2Captcha if TWOCAPTCHA_API_KEY is set
    if await detect_captcha(page):
        logger.warning("CAPTCHA-like page on Amazon — trying 2Captcha / fallback")
        solved = await resolve_or_continue(page)
        if not solved and os.getenv("CLICKLESS_SKIP_CAPTCHA_CHECK", "").lower() not in (
            "1",
            "true",
            "yes",
        ):
            return [_captcha_error_product()]
        if not solved:
            logger.warning("Continuing Amazon scrape after CAPTCHA (skip flag or no sitekey)")

    page_num = 1
    while len(products) < max_results:
        logger.info(f"Scraping Amazon page {page_num}...")
        sel = SELECTORS["search_results"]

        items = await page.query_selector_all(sel["container"])
        if not items:
            logger.warning("No search result items found on page")
            break

        for item in items:
            if len(products) >= max_results:
                break

            product = await _extract_product(item, sel)
            if not product:
                continue

            # Skip sponsored results (flag them)
            sponsored_el = await item.query_selector(sel["sponsored_label"])
            if sponsored_el:
                product["sponsored"] = True

            # Apply filters
            if max_price and product.get("price") and product["price"] > max_price:
                continue
            if min_rating and product.get("rating") and product["rating"] < min_rating:
                continue

            products.append(product)

        # Pagination: try next page if we need more results
        if len(products) < max_results:
            next_btn = await page.query_selector(SELECTORS["pagination"]["next_page"])
            if next_btn:
                await next_btn.click()
                await random_delay(2, 4)
                page_num += 1

                if await detect_captcha(page):
                    if await resolve_or_continue(page):
                        continue
                    if os.getenv("CLICKLESS_SKIP_CAPTCHA_CHECK", "").lower() not in (
                        "1",
                        "true",
                        "yes",
                    ):
                        logger.warning("CAPTCHA on pagination - stopping")
                        break
            else:
                break  # No more pages

    logger.info(f"Amazon: scraped {len(products)} products for '{query}'")
    return products


async def _extract_product(item, sel: Dict) -> Optional[Dict]:
    """Extract a single product from a search result element."""
    try:
        # Title
        title_el = await item.query_selector(sel["title"])
        title = await title_el.inner_text() if title_el else None
        if not title:
            return None

        # Product URL
        link_el = await item.query_selector(sel["title_link"])
        href = await link_el.get_attribute("href") if link_el else None
        product_url = f"https://www.amazon.com{href}" if href and href.startswith("/") else href

        # Price
        price_el = await item.query_selector(sel["price_whole"])
        price_text = await price_el.inner_text() if price_el else None
        price = _parse_price(price_text)

        # Original price (for sale detection)
        original_price_el = await item.query_selector(sel["price_original"])
        original_price_text = await original_price_el.inner_text() if original_price_el else None
        original_price = _parse_price(original_price_text)

        # Rating
        rating_el = await item.query_selector(sel["rating"])
        rating_text = await rating_el.inner_text() if rating_el else None
        rating = _parse_rating(rating_text)

        # Review count
        review_el = await item.query_selector(sel["review_count"])
        review_text = await review_el.inner_text() if review_el else None
        review_count = _parse_review_count(review_text)

        # Image
        image_el = await item.query_selector(sel["image"])
        image_url = await image_el.get_attribute("src") if image_el else None

        # Delivery info
        delivery_el = await item.query_selector(sel["delivery"])
        delivery_text = await delivery_el.get_attribute("aria-label") if delivery_el else None

        # Prime badge
        prime_el = await item.query_selector(sel["prime_badge"])
        is_prime = prime_el is not None

        # Out of stock check
        stock_el = await item.query_selector(sel["out_of_stock"])
        stock_text = await stock_el.inner_text() if stock_el else ""
        in_stock = "currently unavailable" not in stock_text.lower()

        return _normalize_product(
            title=title,
            price=price,
            original_price=original_price,
            rating=rating,
            review_count=review_count,
            image_url=image_url,
            product_url=product_url,
            delivery_estimate=delivery_text,
            prime=is_prime,
            in_stock=in_stock,
            site="amazon",
        )

    except Exception as e:
        logger.debug(f"Failed to extract product: {e}")
        return None


def _normalize_product(
    title: str,
    price: Optional[float],
    original_price: Optional[float],
    rating: Optional[float],
    review_count: int,
    image_url: Optional[str],
    product_url: Optional[str],
    delivery_estimate: Optional[str],
    prime: bool,
    in_stock: bool,
    site: str,
) -> Dict:
    """
    Return a product dict matching the shared normalized product schema.
    This is the contract between Member B (scraper) and the rest of the system.
    """
    return {
        "title": title.strip() if title else "Unknown Product",
        "price": price,
        "original_price": original_price,
        "currency": "USD",
        "rating": rating,
        "review_count": review_count,
        "image_url": image_url,
        "product_url": product_url,
        "delivery_estimate": delivery_estimate,
        "prime": prime,
        "in_stock": in_stock,
        "sponsored": False,
        "site": site,
        "source": site,
    }


def _captcha_error_product() -> Dict:
    """Return a placeholder indicating CAPTCHA was encountered."""
    return {
        "title": "[CAPTCHA] Amazon blocked automated access",
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
        "site": "amazon",
        "source": "amazon",
        "error": "captcha_required",
    }
