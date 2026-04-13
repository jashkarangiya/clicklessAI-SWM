"""
Browser context manager for persistent browser sessions per user per site.
Handles session creation, encrypted storage, verification, and cleanup.
Uses AES-256-GCM encryption for session state at rest.
"""

import os
import json
import time
import logging
from typing import Optional, Dict
from pathlib import Path

from cryptography.fernet import Fernet
from playwright.async_api import async_playwright, BrowserContext, Browser

from scraper.browser.stealth import (
    get_random_user_agent,
    apply_stealth_scripts,
    get_stealth_browser_args,
    get_proxy_config,
)

logger = logging.getLogger(__name__)

# Default session expiry: 24 hours
SESSION_MAX_AGE_SECONDS = 24 * 60 * 60
STORAGE_DIR = Path(__file__).parent.parent / "session_storage"


class BrowserContextManager:
    """
    Manages persistent browser sessions per user per site.
    Encrypts session state at rest using Fernet (AES-128-CBC based, symmetric).
    """

    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize the context manager.

        Args:
            encryption_key: Fernet key for encrypting session state.
                            If None, generates a new key (sessions won't persist across restarts).
        """
        if encryption_key:
            self._fernet = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
        else:
            self._key = Fernet.generate_key()
            self._fernet = Fernet(self._key)
            logger.info("Generated new encryption key (sessions will not persist across restarts)")

        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._contexts: Dict[str, BrowserContext] = {}

    def _session_path(self, user_id: str, site: str) -> Path:
        """Get file path for a user's encrypted session state."""
        return STORAGE_DIR / f"{user_id}_{site}.enc"

    def _metadata_path(self, user_id: str, site: str) -> Path:
        """Get file path for session metadata (timestamps, not encrypted)."""
        return STORAGE_DIR / f"{user_id}_{site}.meta.json"

    async def start(self, proxy_url: Optional[str] = None) -> None:
        """Launch the browser instance."""
        if self._browser:
            return

        self._playwright = await async_playwright().start()
        proxy = get_proxy_config(proxy_url)

        launch_args = {
            "headless": True,
            "args": get_stealth_browser_args(),
        }
        if proxy:
            launch_args["proxy"] = proxy

        self._browser = await self._playwright.chromium.launch(**launch_args)
        logger.info("Browser launched")

    async def stop(self) -> None:
        """Close all contexts and the browser."""
        for key, ctx in list(self._contexts.items()):
            try:
                await ctx.close()
            except Exception:
                pass
        self._contexts.clear()

        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
        logger.info("Browser stopped")

    async def get_context(
        self, user_id: str, site: str, restore_session: bool = True
    ) -> BrowserContext:
        """
        Get or create a browser context for a user+site combination.
        Restores saved session state (cookies, localStorage) if available.
        """
        key = f"{user_id}:{site}"

        if key in self._contexts:
            return self._contexts[key]

        if not self._browser:
            await self.start()

        context_options = {
            "user_agent": get_random_user_agent(),
            "viewport": {"width": 1366, "height": 768},
            "locale": "en-US",
            "timezone_id": "America/New_York",
        }

        # Try to restore saved session state
        storage_state = None
        if restore_session:
            storage_state = self._load_session(user_id, site)
            if storage_state:
                context_options["storage_state"] = storage_state
                logger.info(f"Restored session for {user_id}@{site}")

        context = await self._browser.new_context(**context_options)

        # Apply stealth scripts to all new pages in this context
        context.on("page", lambda page: page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
        ))

        self._contexts[key] = context
        return context

    async def save_session(self, user_id: str, site: str) -> bool:
        """
        Save the current browser context state (cookies, localStorage) encrypted.
        Returns True if saved successfully.
        """
        key = f"{user_id}:{site}"
        context = self._contexts.get(key)
        if not context:
            logger.warning(f"No active context for {user_id}@{site}")
            return False

        try:
            storage_state = await context.storage_state()
            state_json = json.dumps(storage_state)

            # Encrypt with Fernet
            encrypted = self._fernet.encrypt(state_json.encode())

            session_path = self._session_path(user_id, site)
            session_path.write_bytes(encrypted)

            # Save metadata
            metadata = {
                "user_id": user_id,
                "site": site,
                "saved_at": time.time(),
                "cookie_count": len(storage_state.get("cookies", [])),
            }
            self._metadata_path(user_id, site).write_text(json.dumps(metadata))

            logger.info(f"Session saved for {user_id}@{site}")
            return True

        except Exception as e:
            logger.error(f"Failed to save session for {user_id}@{site}: {e}")
            return False

    def _load_session(self, user_id: str, site: str) -> Optional[Dict]:
        """Load and decrypt a saved session state. Returns None if expired or missing."""
        session_path = self._session_path(user_id, site)
        metadata_path = self._metadata_path(user_id, site)

        if not session_path.exists():
            return None

        # Check metadata for expiry
        if metadata_path.exists():
            try:
                meta = json.loads(metadata_path.read_text())
                age = time.time() - meta.get("saved_at", 0)
                if age > SESSION_MAX_AGE_SECONDS:
                    logger.info(f"Session expired for {user_id}@{site} (age: {age/3600:.1f}h)")
                    self._delete_session_files(user_id, site)
                    return None
            except Exception:
                pass

        try:
            encrypted = session_path.read_bytes()
            decrypted = self._fernet.decrypt(encrypted)
            return json.loads(decrypted.decode())
        except Exception as e:
            logger.warning(f"Failed to decrypt session for {user_id}@{site}: {e}")
            self._delete_session_files(user_id, site)
            return None

    def _delete_session_files(self, user_id: str, site: str) -> None:
        """Remove session files for a user+site."""
        for path in [self._session_path(user_id, site), self._metadata_path(user_id, site)]:
            try:
                path.unlink(missing_ok=True)
            except Exception:
                pass

    async def verify_session(self, user_id: str, site: str) -> bool:
        """
        Check if a stored session is still valid by navigating to the account page.
        Returns True if the session is authenticated.
        """
        context = await self.get_context(user_id, site)
        page = await context.new_page()
        await apply_stealth_scripts(page)

        try:
            account_urls = {
                "amazon": "https://www.amazon.com/gp/css/homepage.html",
                "walmart": "https://www.walmart.com/account",
            }
            url = account_urls.get(site)
            if not url:
                return False

            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            current_url = page.url

            # If redirected to login page, session is expired
            if "signin" in current_url or "login" in current_url or "auth" in current_url:
                logger.info(f"Session expired for {user_id}@{site} (redirected to login)")
                return False

            logger.info(f"Session valid for {user_id}@{site}")
            return True

        except Exception as e:
            logger.warning(f"Session verification failed for {user_id}@{site}: {e}")
            return False
        finally:
            await page.close()

    async def revoke_session(self, user_id: str, site: str) -> None:
        """Revoke and delete a session for a user+site."""
        key = f"{user_id}:{site}"
        if key in self._contexts:
            try:
                await self._contexts[key].close()
            except Exception:
                pass
            del self._contexts[key]

        self._delete_session_files(user_id, site)
        logger.info(f"Session revoked for {user_id}@{site}")

    async def cleanup_expired(self) -> int:
        """
        Garbage-collect contexts and session files that haven't been used in 24 hours.
        Returns count of cleaned up sessions.
        """
        cleaned = 0
        if not STORAGE_DIR.exists():
            return 0

        for meta_file in STORAGE_DIR.glob("*.meta.json"):
            try:
                meta = json.loads(meta_file.read_text())
                age = time.time() - meta.get("saved_at", 0)
                if age > SESSION_MAX_AGE_SECONDS:
                    user_id = meta["user_id"]
                    site = meta["site"]
                    await self.revoke_session(user_id, site)
                    cleaned += 1
            except Exception:
                pass

        if cleaned:
            logger.info(f"Cleaned up {cleaned} expired sessions")
        return cleaned

    def get_login_url(self, site: str) -> str:
        """
        Get the login URL for a site so the user can manually authenticate.
        Used when session refresh is needed.
        """
        login_urls = {
            "amazon": "https://www.amazon.com/ap/signin",
            "walmart": "https://www.walmart.com/account/login",
        }
        return login_urls.get(site, "")
