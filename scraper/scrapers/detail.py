"""
Product detail page scraper for Amazon and Walmart.
Deep-scrapes individual product pages to extract full specifications,
descriptions, images, and availability data beyond what search results provide.
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
    preflight_check,
)

logger = logging.getLogger(__name__)

# Load selectors from YAML registry
_AMAZON_SEL_PATH = Path(__file__).parent.parent / "selectors" / "amazon.yaml"
_WALMART_SEL_PATH = Path(__file__).parent.parent / "selectors" / "walmart.yaml"

with open(_AMAZON_SEL_PATH, "r") as f:
    AMAZON_SELECTORS = yaml.safe_load(f)

with open(_WALMART_SEL_PATH, "r") as f:
    WALMART_SELECTORS = yaml.safe_load(f)


def _parse_price(text: Optional[str]) -> Optional[float]:
    """Extract a numeric price from text like '$29.99'."""
    if not text:
        return None
    match = re.search(r"\$?([\d,]+\.?\d*)", text.replace(",", ""))
    return float(match.group(1)) if match else None


def _parse_rating(text: Optional[str]) -> Optional[float]:
    """Extract rating from text like '4.5 out of 5 stars' or '4.5'."""
    if not text:
        return None
    match = re.search(r"([\d.]+)", text)
    val = float(match.group(1)) if match else None
    return val if val and val <= 5.0 else None


async def scrape_product_detail(
    product_url: str,
    site: str = "amazon",
) -> Dict:
    """
    Scrape a single product detail page for full product information.

    Args:
        product_url: Full URL to the product page.
        site: Either 'amazon' or 'walmart'.

    Returns:
        Dict with full product detail data.
    """
    # aiohttp pre-flight: skip expensive browser launch for dead URLs
    preflight = await preflight_check(product_url)
    if not preflight["reachable"]:
        logger.warning(f"Preflight failed for {product_url} (status: {preflight['status']})")
        return _error_product(site, product_url, f"url_unreachable (status {preflight['status']})")

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
            logger.info(f"Scraping product detail: {product_url}")
            await page.goto(product_url, wait_until="domcontentloaded", timeout=30000)
            await random_delay(2, 4)

            if await detect_captcha(page):
                logger.warning(f"CAPTCHA detected on {site} product page")
                return _captcha_error(site, product_url)

            if site == "amazon":
                return await _extract_amazon_detail(page, product_url)
            elif site == "walmart":
                return await _extract_walmart_detail(page, product_url)
            else:
                logger.error(f"Unsupported site: {site}")
                return _error_product(site, product_url, "unsupported_site")

        except Exception as e:
            logger.error(f"Product detail scrape failed: {e}")
            return _error_product(site, product_url, str(e))
        finally:
            await browser.close()


async def _extract_amazon_detail(page: Page, product_url: str) -> Dict:
    """Extract full product details from an Amazon product page."""
    sel = AMAZON_SELECTORS["product_detail"]

    # Title
    title_el = await page.query_selector(sel["title"])
    title = (await title_el.inner_text()).strip() if title_el else "Unknown Product"

    # Price
    price_el = await page.query_selector(sel["price"])
    price_text = await price_el.inner_text() if price_el else None
    price = _parse_price(price_text)

    # Original price
    orig_el = await page.query_selector(sel["price_original"])
    orig_text = await orig_el.inner_text() if orig_el else None
    original_price = _parse_price(orig_text)

    # Rating
    rating_el = await page.query_selector(sel["rating"])
    rating_text = await rating_el.inner_text() if rating_el else None
    rating = _parse_rating(rating_text)

    # Review count
    review_el = await page.query_selector(sel["review_count"])
    review_text = await review_el.inner_text() if review_el else None
    review_count = _parse_review_count(review_text)

    # Description
    desc_el = await page.query_selector(sel["description"])
    description = (await desc_el.inner_text()).strip() if desc_el else None

    # Feature bullets
    bullet_els = await page.query_selector_all(sel["feature_bullets"])
    features = []
    for el in bullet_els:
        text = (await el.inner_text()).strip()
        if text:
            features.append(text)

    # Main image
    main_img_el = await page.query_selector(sel["main_image"])
    main_image = await main_img_el.get_attribute("src") if main_img_el else None

    # Additional images
    img_els = await page.query_selector_all(sel["images"])
    images = []
    for el in img_els:
        src = await el.get_attribute("src")
        if src and "sprite" not in src:
            images.append(src)

    # Specifications
    spec_rows = await page.query_selector_all(sel["specifications"])
    specifications = {}
    for row in spec_rows:
        cells = await row.query_selector_all("th, td")
        if len(cells) >= 2:
            key = (await cells[0].inner_text()).strip()
            val = (await cells[1].inner_text()).strip()
            if key and val:
                specifications[key] = val

    # Availability
    avail_el = await page.query_selector(sel["availability"])
    availability = (await avail_el.inner_text()).strip() if avail_el else None
    in_stock = True
    if availability:
        in_stock = "unavailable" not in availability.lower()

    # Brand
    brand_el = await page.query_selector(sel["brand"])
    brand = (await brand_el.inner_text()).strip() if brand_el else None

    # Breadcrumb categories
    crumb_els = await page.query_selector_all(sel["category_breadcrumb"])
    categories = []
    for el in crumb_els:
        text = (await el.inner_text()).strip()
        if text:
            categories.append(text)

    # Top reviews
    top_reviews = await _extract_reviews(page, sel)

    # Related products
    related_products = await _extract_related(page, sel)

    return {
        "title": title,
        "price": price,
        "original_price": original_price,
        "currency": "USD",
        "rating": rating,
        "review_count": review_count,
        "description": description,
        "features": features,
        "main_image": main_image,
        "images": images,
        "specifications": specifications,
        "availability": availability,
        "in_stock": in_stock,
        "brand": brand,
        "categories": categories,
        "top_reviews": top_reviews,
        "related_products": related_products,
        "product_url": product_url,
        "site": "amazon",
        "source": "amazon",
    }


async def _extract_walmart_detail(page: Page, product_url: str) -> Dict:
    """Extract full product details from a Walmart product page."""
    sel = WALMART_SELECTORS["product_detail"]

    # Title (try primary, then alt)
    title_el = await page.query_selector(sel["title"])
    if not title_el:
        title_el = await page.query_selector(sel["title_alt"])
    title = (await title_el.inner_text()).strip() if title_el else "Unknown Product"

    # Price (try primary, then alt)
    price_el = await page.query_selector(sel["price"])
    if not price_el:
        price_el = await page.query_selector(sel["price_alt"])
    price_text = await price_el.inner_text() if price_el else None
    price = _parse_price(price_text)

    # Rating
    rating_el = await page.query_selector(sel["rating"])
    rating_text = await rating_el.inner_text() if rating_el else None
    rating = _parse_rating(rating_text)

    # Review count
    review_el = await page.query_selector(sel["review_count"])
    review_text = await review_el.inner_text() if review_el else None
    review_count = _parse_review_count(review_text)

    # Description
    desc_el = await page.query_selector(sel["description"])
    description = (await desc_el.inner_text()).strip() if desc_el else None

    # Main image
    main_img_el = await page.query_selector(sel["main_image"])
    main_image = await main_img_el.get_attribute("src") if main_img_el else None

    # Additional images
    img_els = await page.query_selector_all(sel["images"])
    images = []
    for el in img_els:
        src = await el.get_attribute("src")
        if src:
            images.append(src)

    # Specifications
    spec_rows = await page.query_selector_all(sel["specifications"])
    specifications = {}
    for row in spec_rows:
        cells = await row.query_selector_all("td, th")
        if len(cells) >= 2:
            key = (await cells[0].inner_text()).strip()
            val = (await cells[1].inner_text()).strip()
            if key and val:
                specifications[key] = val

    # Availability
    avail_el = await page.query_selector(sel["availability"])
    in_stock = avail_el is not None

    # Brand
    brand_el = await page.query_selector(sel["brand"])
    brand = (await brand_el.inner_text()).strip() if brand_el else None

    # Seller
    seller_el = await page.query_selector(sel["seller"])
    seller = (await seller_el.inner_text()).strip() if seller_el else None

    # Top reviews
    top_reviews = await _extract_reviews(page, sel)

    # Related products
    related_products = await _extract_related(page, sel)

    return {
        "title": title,
        "price": price,
        "original_price": None,
        "currency": "USD",
        "rating": rating,
        "review_count": review_count,
        "description": description,
        "features": [],
        "main_image": main_image,
        "images": images,
        "specifications": specifications,
        "availability": "In Stock" if in_stock else "Out of Stock",
        "in_stock": in_stock,
        "brand": brand,
        "seller": seller,
        "categories": [],
        "top_reviews": top_reviews,
        "related_products": related_products,
        "product_url": product_url,
        "site": "walmart",
        "source": "walmart",
    }


async def _extract_reviews(page: Page, sel: Dict) -> List[Dict]:
    """Extract top customer reviews from the product page."""
    reviews = []
    try:
        review_els = await page.query_selector_all(sel.get("top_reviews", ""))
        for el in review_els[:5]:  # Limit to top 5 reviews
            review = {}
            text_el = await el.query_selector(sel.get("review_text", ""))
            if text_el:
                review["text"] = (await text_el.inner_text()).strip()
            rating_el = await el.query_selector(sel.get("review_rating", ""))
            if rating_el:
                rating_text = await rating_el.inner_text()
                review["rating"] = _parse_rating(rating_text)
            author_el = await el.query_selector(sel.get("review_author", ""))
            if author_el:
                review["author"] = (await author_el.inner_text()).strip()
            if review.get("text"):
                reviews.append(review)
    except Exception as e:
        logger.debug(f"Review extraction error: {e}")
    return reviews


async def _extract_related(page: Page, sel: Dict) -> List[Dict]:
    """Extract related/recommended products from the product page."""
    related = []
    try:
        # Try related product titles
        title_els = await page.query_selector_all(sel.get("related_title", ""))
        price_els = await page.query_selector_all(sel.get("related_price", ""))
        image_els = await page.query_selector_all(sel.get("related_image", ""))
        link_els = await page.query_selector_all(sel.get("related_products", ""))

        count = min(len(title_els), 5)  # Limit to 5 related products
        for i in range(count):
            item = {}
            item["title"] = (await title_els[i].inner_text()).strip()
            if i < len(price_els):
                price_text = await price_els[i].inner_text()
                item["price"] = _parse_price(price_text)
            if i < len(image_els):
                item["image"] = await image_els[i].get_attribute("src")
            if i < len(link_els):
                href = await link_els[i].get_attribute("href")
                item["url"] = href
            if item.get("title"):
                related.append(item)
    except Exception as e:
        logger.debug(f"Related products extraction error: {e}")
    return related


def _parse_review_count(text: Optional[str]) -> int:
    """Extract review count from text like '1,234 ratings'."""
    if not text:
        return 0
    match = re.search(r"([\d,]+)", text.replace(",", ""))
    return int(match.group(1)) if match else 0


def _captcha_error(site: str, product_url: str) -> Dict:
    """Return a placeholder indicating CAPTCHA was encountered."""
    return {
        "title": f"[CAPTCHA] {site.title()} blocked automated access",
        "price": None,
        "original_price": None,
        "currency": "USD",
        "rating": None,
        "review_count": 0,
        "description": None,
        "features": [],
        "main_image": None,
        "images": [],
        "specifications": {},
        "availability": None,
        "in_stock": False,
        "brand": None,
        "categories": [],
        "top_reviews": [],
        "related_products": [],
        "product_url": product_url,
        "site": site,
        "source": site,
        "error": "captcha_required",
    }


def _error_product(site: str, product_url: str, error: str) -> Dict:
    """Return a placeholder for a failed scrape."""
    return {
        "title": f"[ERROR] Failed to scrape {site.title()} product",
        "price": None,
        "original_price": None,
        "currency": "USD",
        "rating": None,
        "review_count": 0,
        "description": None,
        "features": [],
        "main_image": None,
        "images": [],
        "specifications": {},
        "availability": None,
        "in_stock": False,
        "brand": None,
        "categories": [],
        "top_reviews": [],
        "related_products": [],
        "product_url": product_url,
        "site": site,
        "source": site,
        "error": error,
    }
