"""
Try to resolve reCAPTCHA / hCaptcha on the current Playwright page using 2Captcha.

Works when the page exposes a standard `data-sitekey` widget. Many retail sites use
additional bot layers (Akamai, PerimeterX) that are *not* reCAPTCHA — those need
different products from 2Captcha or won’t be solvable via token injection.

Requires: TWOCAPTCHA_API_KEY
"""

from __future__ import annotations

import logging
from typing import Optional

from playwright.async_api import Page

from scraper.browser.twocaptcha_client import (
    get_api_key,
    solve_hcaptcha,
    solve_recaptcha_v2,
)

logger = logging.getLogger(__name__)


async def _find_sitekey(page: Page) -> Optional[str]:
    try:
        return await page.evaluate(
            """() => {
                const el = document.querySelector('[data-sitekey]');
                return el ? el.getAttribute('data-sitekey') : null;
            }"""
        )
    except Exception as exc:
        logger.debug("sitekey lookup: %s", exc)
        return None


async def _inject_recaptcha_token(page: Page, token: str) -> None:
    await page.evaluate(
        """(t) => {
            const sel = 'textarea[name="g-recaptcha-response"]';
            const ta = document.querySelector(sel);
            if (ta) {
                ta.value = t;
                ta.innerHTML = t;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const r = document.querySelector('[name="h-captcha-response"]');
            if (r) {
                r.value = t;
                r.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }""",
        token,
    )


async def try_resolve_with_twocaptcha(page: Page) -> bool:
    """
    If TWOCAPTCHA_API_KEY is set and a sitekey is found, request a token and inject it.
    Returns True if a token was obtained and injected.
    """
    api_key = get_api_key()
    if not api_key:
        return False

    sitekey = await _find_sitekey(page)
    if not sitekey:
        logger.info("No data-sitekey on page — 2Captcha cannot run (may be non-standard challenge)")
        return False

    url = page.url
    # Prefer hCaptcha if iframe/hcaptcha markers exist
    is_hcaptcha = await page.query_selector("iframe[src*='hcaptcha.com']")
    try:
        if is_hcaptcha:
            token = await solve_hcaptcha(api_key, sitekey, url)
        else:
            token = await solve_recaptcha_v2(api_key, sitekey, url)
    except Exception as exc:
        logger.exception("2Captcha request failed: %s", exc)
        return False

    if not token:
        return False

    await _inject_recaptcha_token(page, token)
    logger.info("Injected captcha token (length=%s)", len(token))
    return True


async def resolve_or_continue(page: Page) -> bool:
    """
    After CAPTCHA-like page: try 2Captcha inject, then reload once to pick up session.

    Returns True if we should continue scraping (caller may reload).
    """
    ok = await try_resolve_with_twocaptcha(page)
    if ok:
        try:
            await page.reload(wait_until="domcontentloaded", timeout=45_000)
        except Exception as exc:
            logger.warning("Reload after captcha solve: %s", exc)
    return ok
