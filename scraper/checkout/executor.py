"""
Checkout automation for Amazon and Walmart.
Handles the full checkout flow: pre-verification, add-to-cart,
address/payment verification, order placement, and confirmation capture.

Includes a dry_run mode that stops before placing the order,
allowing the human-in-the-loop to confirm or cancel.

Every step captures a screenshot for audit and debugging.
Errors are categorized as: retryable, session_expired, or fatal.
"""

import re
import time
import logging
from typing import Dict, Optional
from pathlib import Path

import yaml
from playwright.async_api import Page, BrowserContext

from scraper.browser.stealth import (
    apply_stealth_scripts,
    random_delay,
    detect_captcha,
    human_like_mouse_move,
)
from scraper.browser.context_manager import BrowserContextManager

logger = logging.getLogger(__name__)

# Load all selectors (checkout + product_detail for price verification)
_AMAZON_SEL_PATH = Path(__file__).parent.parent / "selectors" / "amazon.yaml"
_WALMART_SEL_PATH = Path(__file__).parent.parent / "selectors" / "walmart.yaml"

with open(_AMAZON_SEL_PATH, "r") as f:
    _AMAZON_ALL = yaml.safe_load(f)
    AMAZON_CHECKOUT = _AMAZON_ALL["checkout"]
    AMAZON_DETAIL = _AMAZON_ALL["product_detail"]

with open(_WALMART_SEL_PATH, "r") as f:
    _WALMART_ALL = yaml.safe_load(f)
    WALMART_CHECKOUT = _WALMART_ALL["checkout"]
    WALMART_DETAIL = _WALMART_ALL["product_detail"]

# Screenshot directory
SCREENSHOT_DIR = Path(__file__).parent.parent / "screenshots"


def _parse_price(text: Optional[str]) -> Optional[float]:
    """Extract numeric price from text."""
    if not text:
        return None
    match = re.search(r"\$?([\d,]+\.?\d*)", text.replace(",", ""))
    return float(match.group(1)) if match else None


def _classify_error(error_str: str) -> str:
    """Classify an error into: retryable, session_expired, or fatal."""
    error_lower = error_str.lower()
    if any(kw in error_lower for kw in ["captcha", "timeout", "network", "temporary"]):
        return "retryable"
    if any(kw in error_lower for kw in ["login", "signin", "session", "auth", "expired"]):
        return "session_expired"
    return "fatal"


def _make_error(error: str, site: str, step: str, screenshot: Optional[str] = None) -> Dict:
    """Build a standardized error response with category classification."""
    return {
        "status": "error",
        "error": error,
        "error_category": _classify_error(error),
        "failed_step": step,
        "site": site,
        "screenshot": screenshot,
    }


class CheckoutExecutor:
    """
    Executes checkout flows on Amazon and Walmart.
    Requires an authenticated browser session (managed by BrowserContextManager).

    The dry_run flag (default True) stops execution before placing the order,
    giving the human-in-the-loop a chance to review and confirm.
    """

    def __init__(self, context_manager: BrowserContextManager):
        self._ctx_manager = context_manager
        SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    async def _take_screenshot(self, page: Page, step_name: str, site: str) -> Optional[str]:
        """Capture a screenshot at the current step. Returns the file path."""
        try:
            ts = int(time.time())
            filename = f"{site}_{step_name}_{ts}.png"
            path = SCREENSHOT_DIR / filename
            await page.screenshot(path=str(path), full_page=False)
            logger.debug(f"Screenshot saved: {path}")
            return str(path)
        except Exception as e:
            logger.warning(f"Screenshot failed at {step_name}: {e}")
            return None

    async def execute_checkout(
        self,
        user_id: str,
        site: str,
        product_url: str,
        expected_price: Optional[float] = None,
        expected_title: Optional[str] = None,
        confirmed_address: Optional[str] = None,
        payment_last_four: Optional[str] = None,
        dry_run: bool = True,
    ) -> Dict:
        """
        Run the full checkout flow for a product.

        Args:
            user_id: User identifier for session lookup.
            site: 'amazon' or 'walmart'.
            product_url: URL of the product to purchase.
            expected_price: Price from confirmation payload for verification.
            expected_title: Title from confirmation payload for verification.
            confirmed_address: Delivery address to verify against checkout page.
            payment_last_four: Last 4 digits of payment card to verify.
            dry_run: If True, stop before placing order (default True).

        Returns:
            Dict with checkout status, screenshots, and details.
        """
        logger.info(f"Starting checkout: site={site}, dry_run={dry_run}, url={product_url}")
        screenshots = {}

        context = await self._ctx_manager.get_context(user_id, site)
        page = await context.new_page()
        await apply_stealth_scripts(page)

        try:
            # Step 1: Navigate to product page
            result = await self._navigate_to_product(page, product_url, site)
            screenshots["navigate"] = await self._take_screenshot(page, "01_navigate", site)
            if result.get("error"):
                result["screenshots"] = screenshots
                return result

            # Step 2: Pre-checkout verification (price + title match)
            if expected_price is not None:
                verify_result = await self._verify_price(page, site, expected_price, expected_title)
                screenshots["price_verify"] = await self._take_screenshot(page, "02_price_verify", site)
                if verify_result.get("error"):
                    verify_result["screenshots"] = screenshots
                    return verify_result

            # Step 3: Add to cart
            result = await self._add_to_cart(page, site)
            screenshots["add_to_cart"] = await self._take_screenshot(page, "03_add_to_cart", site)
            if result.get("error"):
                result["screenshots"] = screenshots
                return result

            # Step 4: Proceed to checkout
            result = await self._proceed_to_checkout(page, site)
            screenshots["checkout_page"] = await self._take_screenshot(page, "04_checkout", site)
            if result.get("error"):
                result["screenshots"] = screenshots
                return result

            # Step 5: Verify address and payment
            verification = await self._verify_checkout_details(
                page, site, confirmed_address, payment_last_four
            )
            screenshots["verification"] = await self._take_screenshot(page, "05_verify", site)

            # Step 6: Place order or stop (dry_run)
            if dry_run:
                logger.info("Dry run - stopping before order placement")
                return {
                    "status": "ready_to_order",
                    "message": "Checkout ready. Awaiting human confirmation to place order.",
                    "site": site,
                    "product_url": product_url,
                    "verification": verification,
                    "screenshots": screenshots,
                    "dry_run": True,
                }

            # Step 7: Place the order
            order_result = await self._place_order(page, site)
            screenshots["order_result"] = await self._take_screenshot(page, "06_order", site)
            order_result["screenshots"] = screenshots
            return order_result

        except Exception as e:
            logger.error(f"Checkout failed: {e}")
            screenshots["error"] = await self._take_screenshot(page, "error", site)
            result = _make_error(str(e), site, "execute_checkout", screenshots.get("error"))
            result["product_url"] = product_url
            result["screenshots"] = screenshots
            return result
        finally:
            await page.close()

    async def confirm_order(
        self,
        user_id: str,
        site: str,
        product_url: str,
        expected_price: Optional[float] = None,
        confirmed_address: Optional[str] = None,
        payment_last_four: Optional[str] = None,
    ) -> Dict:
        """
        Confirm and place a previously dry-run checkout.
        Called after the human approves the order.
        """
        return await self.execute_checkout(
            user_id=user_id,
            site=site,
            product_url=product_url,
            expected_price=expected_price,
            confirmed_address=confirmed_address,
            payment_last_four=payment_last_four,
            dry_run=False,
        )

    async def _navigate_to_product(self, page: Page, url: str, site: str) -> Dict:
        """Navigate to the product page and verify it loaded."""
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await random_delay(2, 3)

            if await detect_captcha(page):
                return _make_error("captcha_required", site, "navigate")

            return {"status": "ok"}
        except Exception as e:
            return _make_error(f"navigation_failed: {e}", site, "navigate")

    async def _verify_price(
        self, page: Page, site: str, expected_price: float, expected_title: Optional[str]
    ) -> Dict:
        """
        Pre-checkout verification: check that the product page price matches
        the confirmation payload. Abort if price changed by >5%.
        """
        sel = AMAZON_DETAIL if site == "amazon" else WALMART_DETAIL

        try:
            # Get current price from product page
            price_el = await page.query_selector(sel["price"])
            if not price_el and site == "walmart":
                price_el = await page.query_selector(sel.get("price_alt", ""))

            if not price_el:
                logger.warning("Could not find price element for verification")
                return {"status": "ok", "price_verified": False}

            price_text = await price_el.inner_text()
            current_price = _parse_price(price_text)

            if current_price is None:
                logger.warning(f"Could not parse price from: {price_text}")
                return {"status": "ok", "price_verified": False}

            # Check price deviation
            deviation = abs(current_price - expected_price) / expected_price
            if deviation > 0.05:
                logger.warning(
                    f"Price mismatch: expected ${expected_price}, found ${current_price} "
                    f"(deviation: {deviation:.1%})"
                )
                return _make_error(
                    f"price_changed: expected ${expected_price}, found ${current_price} "
                    f"(deviation: {deviation:.1%}, threshold: 5%)",
                    site,
                    "price_verification",
                )

            logger.info(f"Price verified: ${current_price} (expected ${expected_price})")

            # Optional title verification
            if expected_title:
                title_el = await page.query_selector(sel["title"])
                if not title_el and site == "walmart":
                    title_el = await page.query_selector(sel.get("title_alt", ""))
                if title_el:
                    current_title = (await title_el.inner_text()).strip()
                    # Simple containment check (titles can vary slightly)
                    if expected_title.lower()[:30] not in current_title.lower():
                        logger.warning(f"Title mismatch: expected '{expected_title[:50]}...', found '{current_title[:50]}...'")

            return {"status": "ok", "price_verified": True, "current_price": current_price}

        except Exception as e:
            logger.warning(f"Price verification error: {e}")
            return {"status": "ok", "price_verified": False}

    async def _add_to_cart(self, page: Page, site: str) -> Dict:
        """Click add-to-cart and verify item was added."""
        sel = AMAZON_CHECKOUT if site == "amazon" else WALMART_CHECKOUT

        try:
            atc_btn = await page.query_selector(sel["add_to_cart"])
            if not atc_btn and site == "walmart":
                atc_btn = await page.query_selector(sel.get("add_to_cart_alt", ""))

            if not atc_btn:
                return _make_error(
                    "add_to_cart_button_not_found: product may be out of stock",
                    site, "add_to_cart",
                )

            await human_like_mouse_move(page, sel["add_to_cart"])
            await atc_btn.click()
            await random_delay(2, 4)

            confirmation = await page.query_selector(sel["cart_confirmation"])
            if confirmation:
                logger.info("Item added to cart successfully")
            else:
                logger.warning("Cart confirmation not detected, proceeding anyway")

            return {"status": "ok", "message": "Item added to cart"}

        except Exception as e:
            return _make_error(f"add_to_cart_failed: {e}", site, "add_to_cart")

    async def _proceed_to_checkout(self, page: Page, site: str) -> Dict:
        """Navigate from cart to checkout page."""
        sel = AMAZON_CHECKOUT if site == "amazon" else WALMART_CHECKOUT

        try:
            if site == "amazon":
                cart_btn = await page.query_selector(sel.get("cart_confirmation"))
                if cart_btn:
                    await cart_btn.click()
                    await random_delay(1, 2)
            elif site == "walmart":
                view_cart = await page.query_selector(sel.get("view_cart", ""))
                if view_cart:
                    await view_cart.click()
                    await random_delay(1, 2)

            checkout_btn = await page.query_selector(sel["proceed_to_checkout"])
            if not checkout_btn:
                return _make_error(
                    "checkout_button_not_found: user may need to log in",
                    site, "proceed_to_checkout",
                )

            await checkout_btn.click()
            await random_delay(2, 4)

            if await detect_captcha(page):
                return _make_error("captcha_at_checkout", site, "proceed_to_checkout")

            current_url = page.url
            if "signin" in current_url or "login" in current_url:
                return _make_error(
                    "login_required: session expired, user needs to re-authenticate",
                    site, "proceed_to_checkout",
                )

            return {"status": "ok", "message": "Proceeded to checkout"}

        except Exception as e:
            return _make_error(f"checkout_navigation_failed: {e}", site, "proceed_to_checkout")

    async def _verify_checkout_details(
        self,
        page: Page,
        site: str,
        confirmed_address: Optional[str] = None,
        payment_last_four: Optional[str] = None,
    ) -> Dict:
        """
        Verify shipping address and payment method on checkout page.
        If confirmed_address or payment_last_four are provided, compare them
        against what's displayed and flag mismatches.
        """
        sel = AMAZON_CHECKOUT if site == "amazon" else WALMART_CHECKOUT
        verification = {
            "address_found": False,
            "payment_found": False,
            "address_text": None,
            "payment_text": None,
            "address_match": None,
            "payment_match": None,
        }

        try:
            # Check for shipping address
            addr_el = await page.query_selector(sel.get("checkout_address", ""))
            if addr_el:
                verification["address_found"] = True
                verification["address_text"] = (await addr_el.inner_text()).strip()
                if confirmed_address:
                    verification["address_match"] = (
                        confirmed_address.lower() in verification["address_text"].lower()
                    )

            # Check for payment method
            pay_el = await page.query_selector(sel.get("checkout_payment", ""))
            if pay_el:
                verification["payment_found"] = True
                verification["payment_text"] = (await pay_el.inner_text()).strip()
                if payment_last_four:
                    verification["payment_match"] = (
                        payment_last_four in verification["payment_text"]
                    )

            logger.info(
                f"Checkout verification: address={'yes' if verification['address_found'] else 'no'}, "
                f"payment={'yes' if verification['payment_found'] else 'no'}, "
                f"addr_match={verification['address_match']}, "
                f"pay_match={verification['payment_match']}"
            )

        except Exception as e:
            logger.warning(f"Checkout verification error: {e}")

        return verification

    async def _place_order(self, page: Page, site: str) -> Dict:
        """Click the final place-order button and capture confirmation."""
        sel = AMAZON_CHECKOUT if site == "amazon" else WALMART_CHECKOUT

        try:
            place_btn = await page.query_selector(sel["place_order"])
            if not place_btn:
                return _make_error(
                    "place_order_button_not_found", site, "place_order"
                )

            await place_btn.click()
            await random_delay(3, 6)

            # Wait for confirmation page
            confirmation_el = await page.query_selector(sel.get("order_confirmation", ""))
            order_id_el = await page.query_selector(sel.get("order_id", ""))
            delivery_el = await page.query_selector(sel.get("delivery_date", ""))

            order_id = (await order_id_el.inner_text()).strip() if order_id_el else None
            delivery_date = (await delivery_el.inner_text()).strip() if delivery_el else None

            # Capture confirmation screenshot
            confirmation_screenshot = await self._take_screenshot(page, "confirmation", site)

            if confirmation_el or order_id:
                logger.info(f"Order placed successfully: {order_id}")
                return {
                    "status": "order_placed",
                    "order_id": order_id,
                    "delivery_date": delivery_date,
                    "site": site,
                    "dry_run": False,
                    "confirmation_screenshot": confirmation_screenshot,
                }
            else:
                return {
                    "status": "uncertain",
                    "message": "Order may have been placed but confirmation not detected.",
                    "site": site,
                    "current_url": page.url,
                    "confirmation_screenshot": confirmation_screenshot,
                }

        except Exception as e:
            return _make_error(f"place_order_failed: {e}", site, "place_order")

    async def get_cart_summary(self, user_id: str, site: str) -> Dict:
        """
        Get a summary of items currently in the cart.
        Useful for pre-checkout verification.
        """
        context = await self._ctx_manager.get_context(user_id, site)
        page = await context.new_page()
        await apply_stealth_scripts(page)

        try:
            cart_urls = {
                "amazon": "https://www.amazon.com/gp/cart/view.html",
                "walmart": "https://www.walmart.com/cart",
            }
            url = cart_urls.get(site)
            if not url:
                return _make_error("unsupported_site", site, "get_cart_summary")

            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await random_delay(1, 2)

            sel = AMAZON_CHECKOUT if site == "amazon" else WALMART_CHECKOUT

            count_el = await page.query_selector(sel.get("cart_count", ""))
            cart_count = (await count_el.inner_text()).strip() if count_el else "0"

            title_els = await page.query_selector_all(sel.get("cart_item_title", ""))
            items = []
            for el in title_els:
                text = (await el.inner_text()).strip()
                if text:
                    items.append(text)

            return {
                "status": "ok",
                "site": site,
                "cart_count": cart_count,
                "items": items,
            }

        except Exception as e:
            return _make_error(str(e), site, "get_cart_summary")
        finally:
            await page.close()
