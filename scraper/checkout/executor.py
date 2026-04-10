"""
Checkout automation for Amazon and Walmart.
Handles the full checkout flow: add-to-cart, address/payment verification,
order placement, and confirmation capture.

Includes a dry_run mode that stops before placing the order,
allowing the human-in-the-loop to confirm or cancel.
"""

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

# Load checkout selectors
_AMAZON_SEL_PATH = Path(__file__).parent.parent / "selectors" / "amazon.yaml"
_WALMART_SEL_PATH = Path(__file__).parent.parent / "selectors" / "walmart.yaml"

with open(_AMAZON_SEL_PATH, "r") as f:
    AMAZON_SELECTORS = yaml.safe_load(f)["checkout"]

with open(_WALMART_SEL_PATH, "r") as f:
    WALMART_SELECTORS = yaml.safe_load(f)["checkout"]


class CheckoutExecutor:
    """
    Executes checkout flows on Amazon and Walmart.
    Requires an authenticated browser session (managed by BrowserContextManager).

    The dry_run flag (default True) stops execution before placing the order,
    giving the human-in-the-loop a chance to review and confirm.
    """

    def __init__(self, context_manager: BrowserContextManager):
        self._ctx_manager = context_manager

    async def execute_checkout(
        self,
        user_id: str,
        site: str,
        product_url: str,
        dry_run: bool = True,
    ) -> Dict:
        """
        Run the full checkout flow for a product.

        Args:
            user_id: User identifier for session lookup.
            site: 'amazon' or 'walmart'.
            product_url: URL of the product to purchase.
            dry_run: If True, stop before placing order (default True).

        Returns:
            Dict with checkout status and details.
        """
        logger.info(f"Starting checkout: site={site}, dry_run={dry_run}, url={product_url}")

        context = await self._ctx_manager.get_context(user_id, site)
        page = await context.new_page()
        await apply_stealth_scripts(page)

        try:
            # Step 1: Navigate to product page
            result = await self._navigate_to_product(page, product_url, site)
            if result.get("error"):
                return result

            # Step 2: Add to cart
            result = await self._add_to_cart(page, site)
            if result.get("error"):
                return result

            # Step 3: Proceed to checkout
            result = await self._proceed_to_checkout(page, site)
            if result.get("error"):
                return result

            # Step 4: Verify address and payment
            verification = await self._verify_checkout_details(page, site)

            # Step 5: Place order or stop (dry_run)
            if dry_run:
                logger.info("Dry run - stopping before order placement")
                return {
                    "status": "ready_to_order",
                    "message": "Checkout ready. Awaiting human confirmation to place order.",
                    "site": site,
                    "product_url": product_url,
                    "verification": verification,
                    "dry_run": True,
                }

            # Step 6: Place the order
            order_result = await self._place_order(page, site)
            return order_result

        except Exception as e:
            logger.error(f"Checkout failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "site": site,
                "product_url": product_url,
            }
        finally:
            await page.close()

    async def confirm_order(
        self,
        user_id: str,
        site: str,
        product_url: str,
    ) -> Dict:
        """
        Confirm and place a previously dry-run checkout.
        Called after the human approves the order.
        """
        return await self.execute_checkout(
            user_id=user_id,
            site=site,
            product_url=product_url,
            dry_run=False,
        )

    async def _navigate_to_product(self, page: Page, url: str, site: str) -> Dict:
        """Navigate to the product page and verify it loaded."""
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await random_delay(2, 3)

            if await detect_captcha(page):
                return {"status": "error", "error": "captcha_required", "site": site}

            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "error": f"navigation_failed: {e}", "site": site}

    async def _add_to_cart(self, page: Page, site: str) -> Dict:
        """Click add-to-cart and verify item was added."""
        sel = AMAZON_SELECTORS if site == "amazon" else WALMART_SELECTORS

        try:
            # Find add-to-cart button
            atc_btn = await page.query_selector(sel["add_to_cart"])
            if not atc_btn and site == "walmart":
                atc_btn = await page.query_selector(sel.get("add_to_cart_alt", ""))

            if not atc_btn:
                return {
                    "status": "error",
                    "error": "add_to_cart_button_not_found",
                    "site": site,
                    "message": "Product may be out of stock or page structure changed.",
                }

            # Human-like interaction
            await human_like_mouse_move(page, sel["add_to_cart"])
            await atc_btn.click()
            await random_delay(2, 4)

            # Verify cart confirmation
            confirmation = await page.query_selector(sel["cart_confirmation"])
            if confirmation:
                logger.info("Item added to cart successfully")
            else:
                logger.warning("Cart confirmation not detected, proceeding anyway")

            return {"status": "ok", "message": "Item added to cart"}

        except Exception as e:
            return {"status": "error", "error": f"add_to_cart_failed: {e}", "site": site}

    async def _proceed_to_checkout(self, page: Page, site: str) -> Dict:
        """Navigate from cart to checkout page."""
        sel = AMAZON_SELECTORS if site == "amazon" else WALMART_SELECTORS

        try:
            # For Amazon: go to cart first, then checkout
            # For Walmart: view cart, then checkout
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

            # Click proceed to checkout
            checkout_btn = await page.query_selector(sel["proceed_to_checkout"])
            if not checkout_btn:
                return {
                    "status": "error",
                    "error": "checkout_button_not_found",
                    "site": site,
                    "message": "Could not find checkout button. User may need to log in.",
                }

            await checkout_btn.click()
            await random_delay(2, 4)

            if await detect_captcha(page):
                return {"status": "error", "error": "captcha_at_checkout", "site": site}

            # Check if redirected to login
            current_url = page.url
            if "signin" in current_url or "login" in current_url:
                return {
                    "status": "error",
                    "error": "login_required",
                    "site": site,
                    "message": "Session expired. User needs to re-authenticate.",
                }

            return {"status": "ok", "message": "Proceeded to checkout"}

        except Exception as e:
            return {"status": "error", "error": f"checkout_navigation_failed: {e}", "site": site}

    async def _verify_checkout_details(self, page: Page, site: str) -> Dict:
        """Verify shipping address and payment method are present on checkout page."""
        sel = AMAZON_SELECTORS if site == "amazon" else WALMART_SELECTORS
        verification = {
            "address_found": False,
            "payment_found": False,
            "address_text": None,
            "payment_text": None,
        }

        try:
            # Check for shipping address
            addr_el = await page.query_selector(sel.get("checkout_address", ""))
            if addr_el:
                verification["address_found"] = True
                verification["address_text"] = (await addr_el.inner_text()).strip()

            # Check for payment method
            pay_el = await page.query_selector(sel.get("checkout_payment", ""))
            if pay_el:
                verification["payment_found"] = True
                verification["payment_text"] = (await pay_el.inner_text()).strip()

            logger.info(
                f"Checkout verification: address={'yes' if verification['address_found'] else 'no'}, "
                f"payment={'yes' if verification['payment_found'] else 'no'}"
            )

        except Exception as e:
            logger.warning(f"Checkout verification error: {e}")

        return verification

    async def _place_order(self, page: Page, site: str) -> Dict:
        """Click the final place-order button and capture confirmation."""
        sel = AMAZON_SELECTORS if site == "amazon" else WALMART_SELECTORS

        try:
            place_btn = await page.query_selector(sel["place_order"])
            if not place_btn:
                return {
                    "status": "error",
                    "error": "place_order_button_not_found",
                    "site": site,
                }

            await place_btn.click()
            await random_delay(3, 6)

            # Wait for confirmation page
            confirmation_el = await page.query_selector(sel.get("order_confirmation", ""))
            order_id_el = await page.query_selector(sel.get("order_id", ""))
            delivery_el = await page.query_selector(sel.get("delivery_date", ""))

            order_id = (await order_id_el.inner_text()).strip() if order_id_el else None
            delivery_date = (await delivery_el.inner_text()).strip() if delivery_el else None

            if confirmation_el or order_id:
                logger.info(f"Order placed successfully: {order_id}")
                return {
                    "status": "order_placed",
                    "order_id": order_id,
                    "delivery_date": delivery_date,
                    "site": site,
                    "dry_run": False,
                }
            else:
                # Take screenshot for debugging
                screenshot_path = f"/tmp/checkout_result_{site}.png"
                try:
                    await page.screenshot(path=screenshot_path)
                except Exception:
                    screenshot_path = None

                return {
                    "status": "uncertain",
                    "message": "Order may have been placed but confirmation not detected.",
                    "screenshot": screenshot_path,
                    "site": site,
                    "current_url": page.url,
                }

        except Exception as e:
            return {
                "status": "error",
                "error": f"place_order_failed: {e}",
                "site": site,
            }

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
                return {"status": "error", "error": "unsupported_site"}

            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await random_delay(1, 2)

            sel = AMAZON_SELECTORS if site == "amazon" else WALMART_SELECTORS

            # Get cart count
            count_el = await page.query_selector(sel.get("cart_count", ""))
            cart_count = (await count_el.inner_text()).strip() if count_el else "0"

            # Get item titles
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
            return {"status": "error", "error": str(e), "site": site}
        finally:
            await page.close()
