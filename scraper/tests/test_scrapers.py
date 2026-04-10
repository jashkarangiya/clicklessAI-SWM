"""
Tests for the scraper module.
Covers search scrapers, detail scraper, stealth utilities,
browser context management, and checkout executor.

Uses pytest + pytest-asyncio for async test support.
Some tests make real HTTP calls and require Playwright browsers installed.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from pathlib import Path

# ── Unit tests for parse helpers ───────────────────────────────────────


class TestAmazonParsers:
    """Test Amazon scraper parse helper functions."""

    def test_parse_price_standard(self):
        from scraper.scrapers.amazon import _parse_price
        assert _parse_price("$29.99") == 29.99

    def test_parse_price_with_comma(self):
        from scraper.scrapers.amazon import _parse_price
        assert _parse_price("$1,299.00") == 1299.00

    def test_parse_price_none(self):
        from scraper.scrapers.amazon import _parse_price
        assert _parse_price(None) is None

    def test_parse_price_empty(self):
        from scraper.scrapers.amazon import _parse_price
        assert _parse_price("") is None

    def test_parse_price_no_dollar(self):
        from scraper.scrapers.amazon import _parse_price
        assert _parse_price("29.99") == 29.99

    def test_parse_rating_standard(self):
        from scraper.scrapers.amazon import _parse_rating
        assert _parse_rating("4.5 out of 5 stars") == 4.5

    def test_parse_rating_none(self):
        from scraper.scrapers.amazon import _parse_rating
        assert _parse_rating(None) is None

    def test_parse_rating_no_match(self):
        from scraper.scrapers.amazon import _parse_rating
        assert _parse_rating("no rating here") is None

    def test_parse_review_count(self):
        from scraper.scrapers.amazon import _parse_review_count
        assert _parse_review_count("1,234 ratings") == 1234

    def test_parse_review_count_none(self):
        from scraper.scrapers.amazon import _parse_review_count
        assert _parse_review_count(None) == 0

    def test_parse_review_count_empty(self):
        from scraper.scrapers.amazon import _parse_review_count
        assert _parse_review_count("") == 0


class TestWalmartParsers:
    """Test Walmart scraper parse helper functions."""

    def test_parse_price_standard(self):
        from scraper.scrapers.walmart import _parse_price
        assert _parse_price("$29.99") == 29.99

    def test_parse_price_now_prefix(self):
        from scraper.scrapers.walmart import _parse_price
        assert _parse_price("Now $29.99") == 29.99

    def test_parse_price_none(self):
        from scraper.scrapers.walmart import _parse_price
        assert _parse_price(None) is None

    def test_parse_rating_numeric(self):
        from scraper.scrapers.walmart import _parse_rating
        assert _parse_rating("4.5") == 4.5

    def test_parse_rating_with_parens(self):
        from scraper.scrapers.walmart import _parse_rating
        assert _parse_rating("(4.5)") == 4.5

    def test_parse_rating_above_five(self):
        from scraper.scrapers.walmart import _parse_rating
        assert _parse_rating("6.0") is None

    def test_parse_rating_none(self):
        from scraper.scrapers.walmart import _parse_rating
        assert _parse_rating(None) is None

    def test_parse_review_count(self):
        from scraper.scrapers.walmart import _parse_review_count
        assert _parse_review_count("1234 reviews") == 1234

    def test_parse_review_count_none(self):
        from scraper.scrapers.walmart import _parse_review_count
        assert _parse_review_count(None) == 0


class TestDetailParsers:
    """Test detail scraper parse helper functions."""

    def test_parse_price(self):
        from scraper.scrapers.detail import _parse_price
        assert _parse_price("$49.99") == 49.99

    def test_parse_rating(self):
        from scraper.scrapers.detail import _parse_rating
        assert _parse_rating("4.2 out of 5") == 4.2

    def test_parse_review_count(self):
        from scraper.scrapers.detail import _parse_review_count
        assert _parse_review_count("5,678 reviews") == 5678


# ── Unit tests for stealth module ──────────────────────────────────────


class TestStealthModule:
    """Test the anti-bot stealth utilities."""

    def test_get_random_user_agent_returns_string(self):
        from scraper.browser.stealth import get_random_user_agent
        ua = get_random_user_agent()
        assert isinstance(ua, str)
        assert "Mozilla" in ua

    def test_get_random_user_agent_varies(self):
        from scraper.browser.stealth import get_random_user_agent
        agents = {get_random_user_agent() for _ in range(50)}
        assert len(agents) > 1, "User agent rotation should return different agents"

    def test_get_stealth_browser_args(self):
        from scraper.browser.stealth import get_stealth_browser_args
        args = get_stealth_browser_args()
        assert isinstance(args, list)
        assert "--disable-blink-features=AutomationControlled" in args

    def test_get_proxy_config_none(self):
        from scraper.browser.stealth import get_proxy_config
        assert get_proxy_config(None) is None

    def test_get_proxy_config_with_url(self):
        from scraper.browser.stealth import get_proxy_config
        config = get_proxy_config("http://proxy:8080")
        assert config == {"server": "http://proxy:8080"}

    def test_captcha_indicators_exist(self):
        from scraper.browser.stealth import CAPTCHA_INDICATORS
        assert len(CAPTCHA_INDICATORS) > 0
        assert "captcha" in CAPTCHA_INDICATORS

    def test_stealth_scripts_exist(self):
        from scraper.browser.stealth import STEALTH_SCRIPTS
        assert len(STEALTH_SCRIPTS) > 0
        assert any("webdriver" in s for s in STEALTH_SCRIPTS)


# ── Unit tests for selector loading ────────────────────────────────────


class TestSelectorRegistry:
    """Test that selector YAML files load correctly."""

    def test_amazon_selectors_load(self):
        import yaml
        path = Path(__file__).parent.parent / "selectors" / "amazon.yaml"
        with open(path) as f:
            sel = yaml.safe_load(f)
        assert "search_results" in sel
        assert "product_detail" in sel
        assert "checkout" in sel
        assert "pagination" in sel

    def test_walmart_selectors_load(self):
        import yaml
        path = Path(__file__).parent.parent / "selectors" / "walmart.yaml"
        with open(path) as f:
            sel = yaml.safe_load(f)
        assert "search_results" in sel
        assert "product_detail" in sel
        assert "checkout" in sel
        assert "pagination" in sel

    def test_amazon_required_fields(self):
        import yaml
        path = Path(__file__).parent.parent / "selectors" / "amazon.yaml"
        with open(path) as f:
            sel = yaml.safe_load(f)
        required = ["container", "title", "price_whole", "rating", "image"]
        for field in required:
            assert field in sel["search_results"], f"Missing: {field}"

    def test_walmart_required_fields(self):
        import yaml
        path = Path(__file__).parent.parent / "selectors" / "walmart.yaml"
        with open(path) as f:
            sel = yaml.safe_load(f)
        required = ["container", "title", "price_current", "rating", "image"]
        for field in required:
            assert field in sel["search_results"], f"Missing: {field}"


# ── Unit tests for context manager ─────────────────────────────────────


class TestBrowserContextManager:
    """Test browser context manager session handling."""

    def test_session_path(self):
        from scraper.browser.context_manager import BrowserContextManager
        mgr = BrowserContextManager()
        path = mgr._session_path("user1", "amazon")
        assert "user1_amazon.enc" in str(path)

    def test_metadata_path(self):
        from scraper.browser.context_manager import BrowserContextManager
        mgr = BrowserContextManager()
        path = mgr._metadata_path("user1", "walmart")
        assert "user1_walmart.meta.json" in str(path)

    def test_encryption_key_generation(self):
        from scraper.browser.context_manager import BrowserContextManager
        mgr = BrowserContextManager()
        assert mgr._fernet is not None

    def test_custom_encryption_key(self):
        from cryptography.fernet import Fernet
        from scraper.browser.context_manager import BrowserContextManager
        key = Fernet.generate_key().decode()
        mgr = BrowserContextManager(encryption_key=key)
        assert mgr._fernet is not None

    def test_login_url_amazon(self):
        from scraper.browser.context_manager import BrowserContextManager
        mgr = BrowserContextManager()
        url = mgr.get_login_url("amazon")
        assert "amazon.com" in url
        assert "signin" in url

    def test_login_url_walmart(self):
        from scraper.browser.context_manager import BrowserContextManager
        mgr = BrowserContextManager()
        url = mgr.get_login_url("walmart")
        assert "walmart.com" in url
        assert "login" in url

    def test_login_url_unknown(self):
        from scraper.browser.context_manager import BrowserContextManager
        mgr = BrowserContextManager()
        assert mgr.get_login_url("unknown_site") == ""


# ── Unit tests for checkout executor ───────────────────────────────────


class TestCheckoutExecutor:
    """Test checkout executor initialization and structure."""

    def test_executor_init(self):
        from scraper.checkout.executor import CheckoutExecutor
        from scraper.browser.context_manager import BrowserContextManager
        mgr = BrowserContextManager()
        executor = CheckoutExecutor(mgr)
        assert executor._ctx_manager is mgr

    def test_amazon_checkout_selectors_loaded(self):
        from scraper.checkout.executor import AMAZON_SELECTORS
        assert "add_to_cart" in AMAZON_SELECTORS
        assert "proceed_to_checkout" in AMAZON_SELECTORS
        assert "place_order" in AMAZON_SELECTORS

    def test_walmart_checkout_selectors_loaded(self):
        from scraper.checkout.executor import WALMART_SELECTORS
        assert "add_to_cart" in WALMART_SELECTORS
        assert "proceed_to_checkout" in WALMART_SELECTORS
        assert "place_order" in WALMART_SELECTORS


# ── Normalized product schema validation ───────────────────────────────


class TestProductSchema:
    """Validate that all scrapers produce the expected product schema."""

    REQUIRED_SEARCH_FIELDS = {
        "title", "price", "original_price", "currency", "rating",
        "review_count", "image_url", "product_url", "delivery_estimate",
        "prime", "in_stock", "sponsored", "site", "source",
    }

    REQUIRED_DETAIL_FIELDS = {
        "title", "price", "currency", "rating", "review_count",
        "description", "features", "main_image", "images",
        "specifications", "in_stock", "product_url", "site", "source",
    }

    def test_amazon_captcha_product_schema(self):
        from scraper.scrapers.amazon import _captcha_error_product
        product = _captcha_error_product()
        assert self.REQUIRED_SEARCH_FIELDS.issubset(product.keys())
        assert product["site"] == "amazon"

    def test_walmart_captcha_product_schema(self):
        from scraper.scrapers.walmart import _captcha_error_product
        product = _captcha_error_product()
        assert self.REQUIRED_SEARCH_FIELDS.issubset(product.keys())
        assert product["site"] == "walmart"

    def test_detail_captcha_schema(self):
        from scraper.scrapers.detail import _captcha_error
        product = _captcha_error("amazon", "https://example.com")
        assert self.REQUIRED_DETAIL_FIELDS.issubset(product.keys())

    def test_detail_error_schema(self):
        from scraper.scrapers.detail import _error_product
        product = _error_product("walmart", "https://example.com", "test_error")
        assert self.REQUIRED_DETAIL_FIELDS.issubset(product.keys())
        assert product["error"] == "test_error"

    def test_amazon_normalize_product(self):
        from scraper.scrapers.amazon import _normalize_product
        product = _normalize_product(
            title="Test Product",
            price=29.99,
            original_price=39.99,
            rating=4.5,
            review_count=100,
            image_url="https://img.example.com/test.jpg",
            product_url="https://amazon.com/dp/TEST",
            delivery_estimate="Tomorrow",
            prime=True,
            in_stock=True,
            site="amazon",
        )
        assert self.REQUIRED_SEARCH_FIELDS.issubset(product.keys())
        assert product["title"] == "Test Product"
        assert product["price"] == 29.99
        assert product["prime"] is True
        assert product["site"] == "amazon"


# ── Integration smoke tests (require Playwright browsers) ──────────────


@pytest.mark.skipif(
    not Path(__file__).parent.parent.parent.joinpath("node_modules").exists(),
    reason="Playwright browsers may not be installed",
)
class TestIntegrationSmoke:
    """
    Smoke tests that launch a real browser.
    Skipped if Playwright browsers aren't installed.
    These test the full pipeline end-to-end.
    """

    @pytest.mark.asyncio
    async def test_amazon_search_returns_list(self):
        """Verify Amazon search returns a list (may be empty if CAPTCHA)."""
        from scraper.scrapers.amazon import search_amazon
        results = await search_amazon("test product", max_results=2)
        assert isinstance(results, list)

    @pytest.mark.asyncio
    async def test_walmart_search_returns_list(self):
        """Verify Walmart search returns a list (may be empty if CAPTCHA)."""
        from scraper.scrapers.walmart import search_walmart
        results = await search_walmart("test product", max_results=2)
        assert isinstance(results, list)

    @pytest.mark.asyncio
    async def test_context_manager_lifecycle(self):
        """Test browser context manager start/stop lifecycle."""
        from scraper.browser.context_manager import BrowserContextManager
        mgr = BrowserContextManager()
        await mgr.start()
        assert mgr._browser is not None
        await mgr.stop()
        assert mgr._browser is None
