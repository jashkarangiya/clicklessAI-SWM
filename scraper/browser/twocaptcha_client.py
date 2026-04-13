"""
2Captcha HTTP API client (reCAPTCHA v2 + hCaptcha).

Get an API key at https://2captcha.com — pay-per-solve; use only where allowed
(e.g. course projects, your own sites, permitted testing).

Env:
  TWOCAPTCHA_API_KEY  — required for solving
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional

import aiohttp

logger = logging.getLogger(__name__)

SUBMIT_URL = "https://2captcha.com/in.php"
RESULT_URL = "https://2captcha.com/res.php"


def get_api_key() -> Optional[str]:
    return os.getenv("TWOCAPTCHA_API_KEY") or os.getenv("CAPTCHA_SOLVER_API_KEY")


async def _poll_result(session: aiohttp.ClientSession, api_key: str, captcha_id: str) -> Optional[str]:
    for attempt in range(48):  # up to ~4 min
        await asyncio.sleep(5)
        params = {"key": api_key, "action": "get", "id": captcha_id, "json": 1}
        async with session.get(RESULT_URL, params=params, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            data = await resp.json(content_type=None)
        if data.get("status") == 1:
            return str(data.get("request", ""))
        req = data.get("request", "")
        if req in ("CAPCHA_NOT_READY", "CAPTCHA_NOT_READY"):
            logger.debug("2Captcha not ready (%s)", attempt)
            continue
        logger.warning("2Captcha poll error: %s", data)
        return None
    logger.warning("2Captcha polling timed out")
    return None


async def solve_recaptcha_v2(
    api_key: str,
    sitekey: str,
    page_url: str,
) -> Optional[str]:
    """Solve Google reCAPTCHA v2; returns g-recaptcha-response token."""
    payload = {
        "key": api_key,
        "method": "userrecaptcha",
        "googlekey": sitekey,
        "pageurl": page_url,
        "json": 1,
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(SUBMIT_URL, data=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            data = await resp.json(content_type=None)
        if data.get("status") != 1:
            logger.error("2Captcha submit (recaptcha v2): %s", data)
            return None
        cid = data.get("request")
        if not cid:
            return None
        logger.info("2Captcha task created: %s", cid)
        return await _poll_result(session, api_key, str(cid))


async def solve_hcaptcha(
    api_key: str,
    sitekey: str,
    page_url: str,
) -> Optional[str]:
    payload = {
        "key": api_key,
        "method": "hcaptcha",
        "sitekey": sitekey,
        "pageurl": page_url,
        "json": 1,
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(SUBMIT_URL, data=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            data = await resp.json(content_type=None)
        if data.get("status") != 1:
            logger.error("2Captcha submit (hcaptcha): %s", data)
            return None
        cid = data.get("request")
        if not cid:
            return None
        logger.info("2Captcha hCaptcha task: %s", cid)
        return await _poll_result(session, api_key, str(cid))
