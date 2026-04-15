"""
Amazon Account Connection

Uvicorn on Windows forces SelectorEventLoop, which cannot spawn subprocesses.
Playwright needs to spawn its browser server subprocess. Fix: run Playwright
entirely inside a dedicated daemon thread that has its own internal event loop
(sync_playwright creates one automatically). The FastAPI async endpoints just
communicate with that thread via threading.Event / concurrent.futures.Future.

Greenlet constraint: Playwright's sync API uses greenlets internally — ALL
Playwright calls (including context.cookies()) must happen on the same thread
that created the sync_playwright context. Never call Playwright objects from
run_in_executor or any other thread.

POST   /api/amazon/launch/{user_id}   — open headed browser to Amazon sign-in
POST   /api/amazon/capture/{user_id}  — capture cookies once user is signed in
GET    /api/amazon/status/{user_id}   — check if a stored session exists
DELETE /api/amazon/session/{user_id}  — remove stored session from MongoDB
"""
import asyncio
import concurrent.futures
import json
import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException

from app.services import user_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["amazon-auth"])

_AMAZON_SIGNIN = (
    "https://www.amazon.com/ap/signin"
    "?openid.pape.max_auth_age=0"
    "&openid.return_to=https%3A%2F%2Fwww.amazon.com%2F"
    "&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select"
    "&openid.assoc_handle=usflex"
    "&openid.mode=checkid_setup"
    "&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select"
    "&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0"
)

_SESSION_COOKIES = {"session-id", "ubid-main", "x-main", "at-main"}

# user_id → active session dict
_browser_sessions: Dict[str, dict] = {}


# ── Thread worker ─────────────────────────────────────────────────────────────

def _playwright_runner(
    user_id: str,
    launch_id: str,
    started: threading.Event,
    stop: threading.Event,
) -> None:
    """
    Runs in a daemon thread.

    Uvicorn forces WindowsSelectorEventLoopPolicy globally, which prevents
    subprocess creation. We override it here before sync_playwright creates its
    internal event loop so the browser server can be spawned.

    Greenlet rule: ALL Playwright calls must happen on THIS thread.
    The capture endpoint posts a concurrent.futures.Future into
    _browser_sessions[user_id]["cookie_future"]; we poll for it and resolve it
    here so context.cookies() is always called on the correct thread/greenlet.
    """
    import sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.error("Playwright not installed")
        started.set()
        return

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=False,
                args=["--disable-blink-features=AutomationControlled"],
            )
            context = browser.new_context(
                viewport={"width": 1024, "height": 720},
                locale="en-US",
                timezone_id="America/Phoenix",
            )
            page = context.new_page()
            page.goto(_AMAZON_SIGNIN, wait_until="domcontentloaded", timeout=30_000)

            _browser_sessions[user_id] = {
                "context": context,
                "launch_id": launch_id,
                "stop": stop,
            }
            started.set()  # Signal: browser is up and ready

            # Poll loop — handles cookie requests AND stop signal.
            # Polling is necessary because stop.wait() would block the thread,
            # preventing us from responding to cookie_future requests.
            while not stop.is_set():
                # Check for a pending cookie-fetch request from capture endpoint
                session = _browser_sessions.get(user_id)
                if session:
                    fut: Optional[concurrent.futures.Future] = session.pop("cookie_future", None)
                    if fut is not None:
                        try:
                            cookies = context.cookies()
                            fut.set_result(cookies)
                        except Exception as exc:
                            fut.set_exception(exc)

                stop.wait(timeout=0.3)  # ~300 ms polling interval

    except Exception:
        logger.exception("Playwright runner error for user=%s", user_id)
    finally:
        _browser_sessions.pop(user_id, None)
        started.set()  # Unblock caller even on error


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/api/amazon/launch/{user_id}")
async def launch_amazon_login(user_id: str):
    """Open a headed browser to Amazon sign-in and wait for user to log in."""
    _stop_browser(user_id)  # Close any stale session

    launch_id = str(uuid.uuid4())
    started = threading.Event()
    stop = threading.Event()

    t = threading.Thread(
        target=_playwright_runner,
        args=(user_id, launch_id, started, stop),
        daemon=True,
        name=f"playwright-{user_id[:8]}",
    )
    t.start()

    # Wait up to 30 s for the browser to open
    ready = await asyncio.get_running_loop().run_in_executor(None, started.wait, 30)

    if not ready or user_id not in _browser_sessions:
        raise HTTPException(status_code=500, detail="Browser failed to open. Is Playwright installed?")

    logger.info("Launched Amazon browser for user=%s launch_id=%s", user_id, launch_id)
    return {"launch_id": launch_id, "status": "awaiting_login"}


@router.post("/api/amazon/capture/{user_id}")
async def capture_amazon_session(user_id: str):
    """
    Capture Amazon session cookies from the running browser.
    Cookies are fetched by posting a Future into the playwright thread's
    polling loop — this avoids the greenlet cross-thread constraint.
    Returns {success: false} if not logged in yet.
    """
    session = _browser_sessions.get(user_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active browser session. Call /api/amazon/launch first.",
        )

    # Post cookie request to the playwright thread
    cookie_future: concurrent.futures.Future = concurrent.futures.Future()
    session["cookie_future"] = cookie_future

    try:
        # run_in_executor just waits for the future — no Playwright calls here
        cookies: list = await asyncio.get_running_loop().run_in_executor(
            None, cookie_future.result, 5.0  # 5-second timeout
        )
    except concurrent.futures.TimeoutError:
        session.pop("cookie_future", None)
        raise HTTPException(status_code=408, detail="Timed out fetching cookies from browser.")
    except Exception as exc:
        logger.exception("Failed to fetch cookies for user=%s", user_id)
        _stop_browser(user_id)
        raise HTTPException(status_code=500, detail=str(exc))

    logged_in = any(c["name"] in _SESSION_COOKIES for c in cookies)
    if not logged_in:
        return {
            "success": False,
            "message": "Not signed in yet — please complete sign-in in the Amazon window.",
        }

    # Persist cookies in MongoDB
    logger.info("capture: storing session for user_id=%r", user_id)
    try:
        await user_service.store_session(user_id, "amazon", json.dumps(cookies))
        logger.info("capture: session stored OK for user_id=%r", user_id)
    except Exception as exc:
        logger.exception("capture: FAILED to store Amazon session for user_id=%r: %s", user_id, exc)
        raise HTTPException(status_code=500, detail=f"Failed to store session: {exc}")

    _stop_browser(user_id)

    ctx_id = f"ctx_{uuid.uuid4().hex[:12]}"
    logger.info("Captured Amazon session for user=%s ctx=%s", user_id, ctx_id)
    return {
        "success": True,
        "browser_context_id": ctx_id,
        "last_verified": datetime.now(timezone.utc).isoformat(),
        "active": True,
        "_debug_user_id": user_id,
    }


@router.get("/api/amazon/status/{user_id}")
async def amazon_session_status(user_id: str):
    """Check if a valid Amazon session is stored for this user."""
    try:
        session = await user_service.get_session(user_id, "amazon")
    except Exception:
        return {"connected": False}
    if not session or not session.encrypted_state:
        return {"connected": False}
    return {
        "connected": True,
        "last_verified": session.created_at.isoformat() if session.created_at else None,
    }


@router.delete("/api/amazon/session/{user_id}", status_code=204)
async def delete_amazon_session(user_id: str):
    """Remove stored Amazon session and close any open browser."""
    _stop_browser(user_id)
    try:
        await user_service.delete_session(user_id, "amazon")
    except Exception:
        pass


# ── Helpers ───────────────────────────────────────────────────────────────────

def _stop_browser(user_id: str) -> None:
    """Signal the Playwright thread to close and remove the session entry."""
    session = _browser_sessions.pop(user_id, None)
    if session:
        session["stop"].set()
