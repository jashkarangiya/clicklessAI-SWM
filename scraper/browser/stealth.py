"""
Anti-bot resilience layer for Playwright browser automation.
Handles request pacing, user-agent rotation, CAPTCHA detection,
proxy rotation, stealth patches, and lightweight HTTP pre-checks via aiohttp.
"""

import os
import random
import asyncio
import logging
from typing import Optional, Dict, List

import aiohttp

logger = logging.getLogger(__name__)

# Pool of 20+ real Chrome user agents for rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.91 Safari/537.36",
]

# JavaScript to mask automation signals
STEALTH_SCRIPTS = [
    # Remove webdriver flag
    "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});",
    # Fake plugins
    """Object.defineProperty(navigator, 'plugins', {
        get: () => [
            {name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer'},
            {name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai'},
            {name: 'Native Client', filename: 'internal-nacl-plugin'}
        ]
    });""",
    # Fake languages
    "Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});",
    # Remove chrome.runtime to avoid detection
    "window.chrome = {runtime: {}, loadTimes: function(){}, csi: function(){}, app: {}};",
    # Fake permissions API
    """const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
        Promise.resolve({state: Notification.permission}) :
        originalQuery(parameters)
    );""",
    # Fake WebGL vendor
    """const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.call(this, parameter);
    };""",
]


def playwright_headless() -> bool:
    """Set CLICKLESS_HEADFUL=1 to open a real browser window (easier to debug / pass checks locally)."""
    return os.getenv("CLICKLESS_HEADFUL", "").lower() not in ("1", "true", "yes")


def get_random_user_agent() -> str:
    """Return a random user agent from the pool."""
    return random.choice(USER_AGENTS)


async def random_delay(min_seconds: float = 2.0, max_seconds: float = 5.0):
    """Random delay between page navigations to mimic human behavior."""
    delay = random.uniform(min_seconds, max_seconds)
    logger.debug(f"Pacing delay: {delay:.1f}s")
    await asyncio.sleep(delay)


async def apply_stealth_scripts(page) -> None:
    """
    Apply stealth patches to a Playwright page to mask automation signals.
    Uses playwright-stealth package if available (preferred — covers ~12 fingerprint
    vectors), then also applies our manual scripts as supplemental patches.
    Must be called before navigating to any page.
    """
    # Try playwright-stealth first (comprehensive coverage)
    # v2.x API: Stealth().apply_stealth_async(page)
    # v1.x API: stealth_async(page)  — kept as fallback
    try:
        from playwright_stealth import Stealth  # type: ignore [import-untyped]
        await Stealth().apply_stealth_async(page)
        logger.debug("playwright-stealth v2 applied")
    except (ImportError, AttributeError):
        try:
            from playwright_stealth import stealth_async  # type: ignore [import-untyped]
            await stealth_async(page)
            logger.debug("playwright-stealth v1 applied")
        except ImportError:
            logger.debug("playwright-stealth not installed — falling back to manual scripts")
            for script in STEALTH_SCRIPTS:
                try:
                    await page.add_init_script(script)
                except Exception as e:
                    logger.debug(f"Stealth script warning: {e}")
            return

    # Apply supplemental manual patches on top of playwright-stealth
    for script in STEALTH_SCRIPTS:
        try:
            await page.add_init_script(script)
        except Exception as e:
            logger.debug(f"Supplemental stealth script warning: {e}")


async def detect_captcha(page) -> bool:
    """
    Detect an *active* bot challenge — not every mention of "recaptcha" in script URLs.

    The old implementation scanned raw HTML for the substring "captcha", which false-
    positives on assets like google.com/recaptcha/api.js on normal pages.

    Retail sites may still block headless automation; that is separate from detection.

    Set CLICKLESS_SKIP_CAPTCHA_CHECK=1 to never short-circuit on CAPTCHA (local class demos
    / grading only — not for production against third-party sites).
    """
    if os.getenv("CLICKLESS_SKIP_CAPTCHA_CHECK", "").lower() in ("1", "true", "yes"):
        logger.info(
            "CLICKLESS_SKIP_CAPTCHA_CHECK=1 — not treating page as CAPTCHA (demo / class build)"
        )
        return False

    try:
        # Strong signals: challenge widgets
        iframe_selectors = [
            "iframe[src*='recaptcha']",
            "iframe[src*='hcaptcha']",
            "iframe[src*='arkose']",
            "iframe[src*='captcha-delivery']",
            "iframe[src*='google.com/recaptcha']",
        ]
        for sel in iframe_selectors:
            found = await page.query_selector(sel)
            if found:
                logger.warning("CAPTCHA / challenge iframe matched: %s", sel)
                return True

        # Block / interstitial titles
        title = (await page.title() or "").lower()
        title_hits = (
            "robot check",
            "access denied",
            "unusual traffic",
            "before we continue",
            "verify it’s you",
            "verify it's you",
            "sorry, we just need",
            "automated requests",
        )
        if any(h in title for h in title_hits):
            logger.warning("CAPTCHA / block page title: %s", title[:120])
            return True

        # Visible page text only (not script-heavy HTML)
        try:
            body_text = (await page.locator("body").inner_text(timeout=8000) or "").lower()
        except Exception:
            body_text = ""

        strong_phrases = [
            "unusual traffic from your computer",
            "unusual traffic from your network",
            "verify you are a human",
            "let us know you're not a robot",
            "let us know you’re not a robot",
            "press and hold",
            "press & hold",
            "solve this puzzle",
            "automated access to our site",
            "sorry, we just need to make sure you're not a robot",
        ]
        for phrase in strong_phrases:
            if phrase in body_text:
                logger.warning("CAPTCHA / block phrase in visible text: %s", phrase[:60])
                return True

        # Weaker keywords: require two hits in visible text to reduce noise
        weak = ("recaptcha challenge", "hcaptcha", "g-recaptcha", "perimeterx", "datadome")
        weak_hits = sum(1 for w in weak if w in body_text)
        if weak_hits >= 1 and ("verify" in body_text or "robot" in body_text):
            logger.warning("CAPTCHA-like content (combined weak signals)")
            return True

    except Exception as e:
        logger.debug("CAPTCHA detection error: %s", e)

    return False


async def human_like_mouse_move(page, selector: str) -> None:
    """Move mouse to element in a human-like pattern before clicking."""
    try:
        element = await page.query_selector(selector)
        if element:
            box = await element.bounding_box()
            if box:
                # Move to a random point within the element
                x = box["x"] + random.uniform(5, box["width"] - 5)
                y = box["y"] + random.uniform(5, box["height"] - 5)
                await page.mouse.move(x, y, steps=random.randint(5, 15))
                await asyncio.sleep(random.uniform(0.1, 0.3))
    except Exception:
        pass


async def human_like_type(page, selector: str, text: str) -> None:
    """Type text with random delays between keystrokes to mimic human typing."""
    await page.click(selector)
    for char in text:
        await page.keyboard.type(char, delay=random.randint(50, 150))
    await asyncio.sleep(random.uniform(0.3, 0.8))


def get_stealth_browser_args() -> List[str]:
    """Return browser launch arguments that help avoid detection."""
    return [
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-infobars",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
    ]


def get_proxy_config(proxy_url: Optional[str] = None) -> Optional[Dict]:
    """
    Build proxy configuration for Playwright.
    Primary path is direct connection; proxy is fallback when blocked.
    """
    if not proxy_url:
        return None

    return {
        "server": proxy_url,
    }


async def preflight_check(url: str, timeout: int = 10) -> Dict:
    """
    Lightweight aiohttp HEAD request to validate a URL before launching Playwright.
    Avoids spinning up a full browser for dead links or server errors.

    Returns:
        Dict with 'reachable' (bool), 'status' (int), and 'redirect_url' (str or None).
    """
    headers = {"User-Agent": get_random_user_agent()}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.head(
                url,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=timeout),
                allow_redirects=True,
            ) as resp:
                return {
                    "reachable": resp.status < 400,
                    "status": resp.status,
                    "redirect_url": str(resp.url) if str(resp.url) != url else None,
                }
    except aiohttp.ClientError as e:
        logger.debug(f"Preflight check failed for {url}: {e}")
        return {"reachable": False, "status": 0, "redirect_url": None}
    except asyncio.TimeoutError:
        logger.debug(f"Preflight check timed out for {url}")
        return {"reachable": False, "status": 0, "redirect_url": None}


async def batch_preflight(urls: List[str], timeout: int = 10) -> List[Dict]:
    """
    Run preflight checks on multiple URLs concurrently using aiohttp.
    Useful for validating a list of product URLs before browser scraping.
    """
    tasks = [preflight_check(url, timeout) for url in urls]
    return await asyncio.gather(*tasks)
