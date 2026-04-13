"""
Amazon cart automation — Playwright browser approach.

All direct HTTP endpoints (/gp/item-dispatch, /gp/aws/cart/add.html,
/gp/add-to-cart/json, /gp/product/handle-buy-box) return 404 in 2024/2025
because Amazon's buy-box now requires JavaScript-set cookies that a plain
HTTP client cannot obtain.

Flow:
  1. Quick HTTP preflight (curl_cffi) to validate session is still live.
  2. Launch Playwright with injected Amazon session cookies.
  3. Navigate to /dp/{ASIN} and click #add-to-cart-button.
"""
import asyncio
import concurrent.futures
import logging
import random
import re
import sys
from pathlib import Path
from typing import Optional

from curl_cffi import requests as cf_requests

logger = logging.getLogger(__name__)

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

_IMPERSONATE = ["chrome124", "chrome123", "chrome120"]
_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
_BASE_HEADERS = {
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent": _UA,
}

# Playwright sameSite values
_SAME_SITE_MAP = {
    "strict": "Strict",
    "lax": "Lax",
    "none": "None",
    "no_restriction": "None",
    "unspecified": "None",
}


def extract_asin(product_url: str) -> Optional[str]:
    if not product_url:
        return None
    match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", product_url)
    return match.group(1) if match else None


def _run_in_new_loop(coro):
    """
    Run *coro* in a brand-new ProactorEventLoop on Windows (required for Playwright
    subprocess launching) or a plain asyncio loop on other platforms.
    Always closes the loop when done.
    """
    import platform
    if platform.system() == "Windows":
        loop = asyncio.ProactorEventLoop()
    else:
        loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()
        asyncio.set_event_loop(None)


def _run_async(coro):
    """
    Run an async coroutine safely from either a sync context or an already-running
    event loop (FastAPI / uvicorn).  In the latter case we offload to a fresh thread
    that owns its own ProactorEventLoop (Windows requires ProactorEventLoop to spawn
    the Playwright subprocess).
    """
    try:
        asyncio.get_running_loop()
        # Inside a running loop (FastAPI) — execute in a worker thread with its own loop
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(_run_in_new_loop, coro).result(timeout=90)
    except RuntimeError:
        # No running loop — we are in a plain sync context
        return _run_in_new_loop(coro)


async def _add_to_cart_browser_async(asin: str, cookies: list[dict]) -> dict:
    """
    Open the Amazon product page in a Playwright browser with the user's stored
    session cookies, then click the Add-to-Cart button.
    """
    try:
        from playwright.async_api import async_playwright
        from scraper.browser.stealth import (
            apply_stealth_scripts,
            get_stealth_browser_args,
            get_random_user_agent,
            playwright_headless,
        )
    except ImportError as exc:
        return {
            "success": False,
            "error": "playwright_missing",
            "message": f"Playwright not installed: {exc}",
        }

    product_url = f"https://www.amazon.com/dp/{asin}"

    # Build Playwright cookie list from stored browser cookies
    playwright_cookies = []
    for c in cookies:
        domain = c.get("domain", ".amazon.com") or ".amazon.com"
        if "amazon" not in domain.lower():
            continue
        # Playwright requires the leading dot for cross-subdomain cookies
        if not domain.startswith("."):
            domain = "." + domain.lstrip(".")
        raw_same_site = (c.get("sameSite") or "none").lower().replace("-", "_")
        same_site = _SAME_SITE_MAP.get(raw_same_site, "None")
        # sameSite=None requires secure=True per browser spec; force it
        secure = True if same_site == "None" else bool(c.get("secure", False))
        playwright_cookies.append({
            "name": c["name"],
            "value": c["value"],
            "domain": domain,
            "path": c.get("path") or "/",
            "secure": secure,
            "httpOnly": bool(c.get("httpOnly", False)),
            "sameSite": same_site,
        })

    logger.warning(
        "add_to_cart_browser: %d Amazon cookies to inject for ASIN=%s",
        len(playwright_cookies), asin,
    )
    if not playwright_cookies:
        return {
            "success": False,
            "error": "no_cookies",
            "message": "No Amazon session cookies found. Please reconnect your account in Settings.",
        }

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=playwright_headless(),
            args=get_stealth_browser_args(),
        )
        context = await browser.new_context(
            user_agent=get_random_user_agent(),
            viewport={"width": 1280, "height": 800},
            locale="en-US",
        )

        # Inject cookies one-by-one so a bad cookie doesn't block all the others
        injected = 0
        for cookie in playwright_cookies:
            try:
                await context.add_cookies([cookie])
                injected += 1
            except Exception as exc:
                logger.warning(
                    "add_to_cart_browser: skipped cookie %r: %s",
                    cookie.get("name"), exc,
                )
        logger.warning(
            "add_to_cart_browser: injected %d/%d cookies",
            injected, len(playwright_cookies),
        )

        page = await context.new_page()
        await apply_stealth_scripts(page)

        try:
            await page.goto(product_url, wait_until="domcontentloaded", timeout=30_000)
        except Exception as exc:
            await browser.close()
            return {"success": False, "error": "navigation_error", "message": str(exc)}

        current_url = page.url
        logger.warning("add_to_cart_browser: page loaded ASIN=%s url=%s", asin, current_url[:80])

        # Confirm browser is actually signed in (not a guest session)
        try:
            acct_text = await page.locator("#nav-link-accountList-nav-line-1").inner_text(timeout=4_000)
            logger.warning("add_to_cart_browser: account nav=%r (should say 'Hello, <name>')", acct_text[:60])
        except Exception:
            logger.warning("add_to_cart_browser: could not read account nav — may be guest session")

        if "ap/signin" in current_url or "/signin" in current_url.lower():
            await browser.close()
            return {
                "success": False,
                "error": "session_expired",
                "message": "Amazon session expired. Please reconnect your account in Settings.",
            }

        # Try known Add-to-Cart button selectors in order of reliability
        atc_selectors = [
            "#add-to-cart-button",
            "input#add-to-cart-button",
            "input[name='submit.add-to-cart']",
            "[data-feature-id='add-to-cart'] input",
            "button[id*='add-to-cart']",
            "#submit\\.add-to-cart",
        ]
        clicked = False
        for sel in atc_selectors:
            try:
                btn = await page.wait_for_selector(sel, timeout=5_000, state="visible")
                if btn:
                    await btn.scroll_into_view_if_needed()
                    await asyncio.sleep(random.uniform(0.3, 0.7))
                    await btn.click()
                    clicked = True
                    logger.warning("add_to_cart_browser: clicked %r ASIN=%s", sel, asin)
                    break
            except Exception:
                continue

        if not clicked:
            title = await page.title()
            await browser.close()
            logger.warning("add_to_cart_browser: no ATC button found ASIN=%s title=%r", asin, title)
            return {
                "success": False,
                "error": "no_button",
                "message": "Could not find the Add to Cart button. The product may be unavailable.",
            }

        # Wait for post-click: either a navigation (older flow) or AJAX settle (newer flow)
        try:
            await page.wait_for_load_state("networkidle", timeout=8_000)
        except Exception:
            pass  # AJAX adds don't always trigger full navigation

        # Dismiss protection plan / warranty upsell if it appears ("No thanks")
        no_thanks_selectors = [
            "button:has-text('No thanks')",
            "a:has-text('No thanks')",
            "span:has-text('No thanks')",
            "[data-action='no-thanks']",
            "#attachSiNoCoverage",
            "input[value='No thanks']",
        ]
        for sel in no_thanks_selectors:
            try:
                btn = await page.wait_for_selector(sel, timeout=3_000, state="visible")
                if btn:
                    await btn.click()
                    logger.warning("add_to_cart_browser: dismissed protection plan upsell")
                    await asyncio.sleep(1)
                    break
            except Exception:
                continue

        final_url = page.url
        logger.warning("add_to_cart_browser: post-click url=%s", final_url[:100])
        await browser.close()

        if "ap/signin" in final_url or "/signin" in final_url.lower():
            return {
                "success": False,
                "error": "session_expired",
                "message": "Amazon session expired. Please reconnect your account in Settings.",
            }

        # If we successfully clicked the button without being bounced to sign-in, it worked
        return {
            "success": True,
            "message": "Product added to your Amazon cart!",
            "cart_url": "https://www.amazon.com/gp/cart/view.html",
            "asin": asin,
        }


def add_to_cart_http(asin: str, cookies: list[dict]) -> dict:
    """
    Add an Amazon product to cart.

    Does a quick HTTP preflight with curl_cffi to verify the session is live,
    then delegates to the Playwright browser flow (the only approach that works
    in 2024/2025 — all direct HTTP add-to-cart endpoints return 404).
    """
    cookie_jar = {
        c["name"]: c["value"]
        for c in cookies
        if "amazon" in c.get("domain", "").lower()
    }
    if not cookie_jar:
        return {
            "success": False,
            "error": "no_cookies",
            "message": "No Amazon session cookies found. Please reconnect your account in Settings.",
        }

    # Quick HTTP preflight — verify session is valid before spinning up a browser
    product_url = f"https://www.amazon.com/dp/{asin}"
    try:
        preflight = cf_requests.get(
            product_url,
            headers={
                **_BASE_HEADERS,
                "Accept": "text/html",
                "Referer": "https://www.amazon.com/",
            },
            cookies=cookie_jar,
            impersonate=random.choice(_IMPERSONATE),
            allow_redirects=True,
            timeout=20,
        )
        final = str(preflight.url)
        logger.warning(
            "add_to_cart preflight ASIN=%s status=%s url=%s",
            asin, preflight.status_code, final[:80],
        )
        if "ap/signin" in final or "/signin" in final.lower():
            return {
                "success": False,
                "error": "session_expired",
                "message": "Amazon session expired. Please reconnect your account in Settings.",
            }
    except Exception as exc:
        logger.warning("add_to_cart preflight failed (continuing anyway): %s", exc)

    # Browser-based add-to-cart
    logger.warning("add_to_cart: launching Playwright browser for ASIN=%s", asin)
    return _run_async(_add_to_cart_browser_async(asin, cookies))
