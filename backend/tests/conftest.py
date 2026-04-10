import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest_asyncio.fixture
async def test_client():
    """Function-scoped AsyncClient.

    Each async test runs in its own event loop (pytest-asyncio default).
    The DB layer (mongo.py, cache.py, postgres.py) detects the running loop
    and creates fresh connections per loop, so Motor/Redis/asyncpg futures are
    always attached to the correct loop.

    Startup tasks (create_tables, ensure_indexes) are idempotent — CREATE IF
    NOT EXISTS / index already exists — so calling them per test is safe.
    """
    from app.db.mongo import ensure_indexes
    from app.db.postgres import create_tables

    await ensure_indexes()
    await create_tables()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture
def sample_user_payload():
    return {"email": "testuser@example.com", "display_name": "Test User"}


@pytest.fixture
def sample_product():
    return {
        "product_id": "prod_test_001",
        "source": "amazon",
        "source_url": "https://amazon.com/dp/test",
        "source_product_id": "B001TEST",
        "name": "Test Headphones",
        "brand": "TestBrand",
        "category": "electronics",
        "pricing": {"current_price": 99.99, "currency": "USD"},
        "ratings": {"average": 4.5, "count": 100},
        "delivery": {"estimated_days": 2, "prime_eligible": True},
        "attributes": {},
        "images": [],
        "scraped_at": "2026-01-01T00:00:00Z",
        "cache_ttl_seconds": 3600,
    }


@pytest.fixture
def sample_confirmation():
    return {
        "product_name": "Test Headphones",
        "current_price": 99.99,
        "delivery_address": "123 Test St, Test City, TC 00000",
        "payment_last_four": "4242",
        "retail_site": "amazon",
        "expires_at": "2026-01-01T01:00:00Z",
    }
